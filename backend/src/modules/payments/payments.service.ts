import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  ParticipationPeriodStatus,
  ParticipationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  MONTHLY_PARTICIPATION_FEE_CENTS,
  PARTICIPATION_CURRENCY,
} from '../participations/participation-period';
import { ParticipationPeriodsService } from '../participations/participation-periods.service';
import {
  PIX_PAYMENT_PROVIDER,
  PixChargeResult,
  PixPaymentProvider,
  PixProviderRequestError,
  PixWebhookRequest,
  VerifiedPixWebhookEvent,
} from './providers/pix-payment-provider.interface';

const PIX_QR_VALIDITY_MS = 30 * 60 * 1_000;

const paymentPixSelect = Prisma.validator<Prisma.PaymentSelect>()({
  id: true,
  amountCents: true,
  currency: true,
  method: true,
  status: true,
  pixCopyPaste: true,
  pixQrCode: true,
  expiresAt: true,
  paidAt: true,
  createdAt: true,
  period: {
    select: {
      referenceYear: true,
      referenceMonth: true,
      startsAt: true,
      endsAt: true,
    },
  },
});

const paymentHistorySelect = Prisma.validator<Prisma.PaymentSelect>()({
  id: true,
  amountCents: true,
  currency: true,
  method: true,
  status: true,
  expiresAt: true,
  paidAt: true,
  createdAt: true,
  period: {
    select: {
      referenceYear: true,
      referenceMonth: true,
      startsAt: true,
      endsAt: true,
    },
  },
});

const paymentStatusSelect = Prisma.validator<Prisma.PaymentSelect>()({
  id: true,
  status: true,
  paidAt: true,
  expiresAt: true,
});

const paymentOperationSelect = Prisma.validator<Prisma.PaymentSelect>()({
  ...paymentPixSelect,
  providerReference: true,
  providerPaymentId: true,
  providerEventId: true,
  providerCreationStartedAt: true,
});

type PixPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentPixSelect;
}>;

type HistoryPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentHistorySelect;
}>;

type StatusPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentStatusSelect;
}>;

type OperationPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentOperationSelect;
}>;

type ReceivedWebhookEvent = Extract<
  VerifiedPixWebhookEvent,
  { kind: 'payment-received' }
>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periodsService: ParticipationPeriodsService,
    @Inject(PIX_PAYMENT_PROVIDER)
    private readonly provider: PixPaymentProvider,
  ) {}

  async createPix(user: AuthenticatedUser) {
    this.ensureProviderIsConfigured();

    const now = new Date();
    const period = await this.periodsService.getOrCreate(now);
    this.ensureFixedParticipationFee(period.participationFeeCents);

    const payment = await this.preparePendingPayment(user.id, period);

    if (this.hasUsablePixPayload(payment, now)) {
      return this.toPixResponse(payment);
    }

    if (payment.providerCreationStartedAt || payment.providerReference) {
      throw this.creationInconclusive();
    }

    const claimedAt = new Date();
    const claim = await this.prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: PaymentStatus.PENDING,
        providerReference: null,
        providerCreationStartedAt: null,
      },
      data: {
        providerCreationStartedAt: claimedAt,
      },
    });

    if (claim.count === 0) {
      const current = await this.prisma.payment.findUnique({
        where: { id: payment.id },
        select: paymentOperationSelect,
      });

      if (current && this.hasUsablePixPayload(current, new Date())) {
        return this.toPixResponse(current);
      }

      throw this.creationInconclusive();
    }

    const requestedExpiration = this.getQrExpiration(claimedAt, period.endsAt);

    let charge: PixChargeResult;

    try {
      charge = await this.provider.createPixCharge({
        amountCents: MONTHLY_PARTICIPATION_FEE_CENTS,
        currency: PARTICIPATION_CURRENCY,
        description: `ParticipaÃ§Ã£o mensal ${String(period.referenceMonth).padStart(2, '0')}/${period.referenceYear}`,
        externalReference: payment.id,
        expiresAt: requestedExpiration,
      });
      this.ensureValidCharge(charge, claimedAt, period.endsAt);
    } catch (error) {
      if (
        error instanceof PixProviderRequestError &&
        error.outcome === 'definitive'
      ) {
        await this.markDefinitiveCreationFailure(payment.id);
        throw this.providerUnavailable();
      }

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw this.creationInconclusive();
    }

    try {
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerReference: charge.providerReference,
          pixCopyPaste: charge.pixCopyPaste,
          pixQrCode: charge.pixQrCode,
          expiresAt: charge.expiresAt,
        },
        select: paymentOperationSelect,
      });

      return this.toPixResponse(updatedPayment);
    } catch {
      throw this.creationInconclusive();
    }
  }

  async findMine(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: paymentHistorySelect,
    });

    return payments.map((payment) => this.toHistoryResponse(payment));
  }

  async findCurrentPix(userId: string, now = new Date()) {
    const descriptor = this.periodsService.getDescriptor(now);
    const payment = await this.prisma.payment.findFirst({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        providerReference: { not: null },
        pixCopyPaste: { not: null },
        pixQrCode: { not: null },
        expiresAt: { gt: now },
        period: {
          referenceYear: descriptor.referenceYear,
          referenceMonth: descriptor.referenceMonth,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: paymentOperationSelect,
    });

    return payment ? this.toPixResponse(payment) : null;
  }

  async findStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      select: paymentStatusSelect,
    });

    if (!payment) {
      throw new NotFoundException('Pagamento nÃ£o encontrado.');
    }

    return this.toStatusResponse(payment);
  }

  async processWebhook(providerName: string, request: PixWebhookRequest) {
    if (providerName !== this.provider.name) {
      throw new NotFoundException('Provedor de pagamento desconhecido.');
    }

    const event = await this.provider.verifyWebhook(request);

    if (event.kind === 'ignored') {
      return { received: true, ignored: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: providerName,
        providerReference: event.providerReference,
      },
      select: {
        id: true,
        amountCents: true,
        currency: true,
        method: true,
        provider: true,
        period: {
          select: {
            participationFeeCents: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return { received: true, ignored: true };
    }

    this.ensureWebhookMatches(payment, event, providerName);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          select: {
            status: true,
            providerPaymentId: true,
            providerEventId: true,
            userId: true,
            periodId: true,
          },
        });

        if (current.status === PaymentStatus.PAID) {
          this.ensureSameReceivedPayment(current, event);
          return { received: true, alreadyProcessed: true };
        }

        if (
          current.status !== PaymentStatus.PENDING &&
          current.status !== PaymentStatus.EXPIRED
        ) {
          throw new BadRequestException({
            code: 'PAYMENT_NOT_PAYABLE',
            message: 'O pagamento local nÃ£o aceita confirmaÃ§Ã£o.',
          });
        }

        const paidAt = new Date();
        const transition = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.EXPIRED],
            },
            providerPaymentId: null,
            providerEventId: null,
          },
          data: {
            providerPaymentId: event.providerPaymentId,
            providerEventId: event.providerEventId,
            status: PaymentStatus.PAID,
            paidAt,
          },
        });

        if (transition.count === 0) {
          const latest = await tx.payment.findUniqueOrThrow({
            where: { id: payment.id },
            select: {
              status: true,
              providerPaymentId: true,
              providerEventId: true,
            },
          });
          this.ensureSameReceivedPayment(latest, event);
          return { received: true, alreadyProcessed: true };
        }

        await tx.participation.upsert({
          where: {
            userId_periodId: {
              userId: current.userId,
              periodId: current.periodId,
            },
          },
          update: {
            status: ParticipationStatus.ACTIVE,
            paymentId: payment.id,
            activatedAt: paidAt,
          },
          create: {
            userId: current.userId,
            periodId: current.periodId,
            paymentId: payment.id,
            status: ParticipationStatus.ACTIVE,
            activatedAt: paidAt,
          },
        });

        return { received: true, alreadyProcessed: false };
      });
    } catch (error) {
      if (this.isUniqueConstraintConflict(error)) {
        throw new BadRequestException({
          code: 'ASAAS_PAYMENT_CONFLICT',
          message: 'O evento Asaas conflita com outro pagamento registrado.',
        });
      }

      throw error;
    }
  }

  private async preparePendingPayment(
    userId: string,
    period: {
      id: string;
      participationFeeCents: number;
    },
  ) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const participation = await tx.participation.findUnique({
              where: {
                userId_periodId: {
                  userId,
                  periodId: period.id,
                },
              },
              select: { status: true },
            });

            if (participation?.status === ParticipationStatus.ACTIVE) {
              throw new ConflictException({
                code: 'PARTICIPATION_ALREADY_ACTIVE',
                message: 'Sua participaÃ§Ã£o neste perÃ­odo jÃ¡ estÃ¡ ativa.',
              });
            }

            await tx.payment.updateMany({
              where: {
                userId,
                periodId: period.id,
                status: PaymentStatus.PENDING,
                expiresAt: { lte: new Date() },
              },
              data: { status: PaymentStatus.EXPIRED },
            });

            const pendingPayment = await tx.payment.findFirst({
              where: {
                userId,
                periodId: period.id,
                status: PaymentStatus.PENDING,
              },
              orderBy: { createdAt: 'desc' },
              select: paymentOperationSelect,
            });

            if (pendingPayment) {
              return pendingPayment;
            }

            return tx.payment.create({
              data: {
                userId,
                periodId: period.id,
                amountCents: MONTHLY_PARTICIPATION_FEE_CENTS,
                currency: PARTICIPATION_CURRENCY,
                method: PaymentMethod.PIX,
                status: PaymentStatus.PENDING,
                provider: this.provider.name,
              },
              select: paymentOperationSelect,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }

        if (attempt === 0 && this.isConcurrencyConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('NÃ£o foi possÃ­vel reservar a cobranÃ§a PIX.');
  }

  private async markDefinitiveCreationFailure(paymentId: string) {
    await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: PaymentStatus.PENDING,
        providerReference: null,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  private hasUsablePixPayload(payment: OperationPayment, now: Date) {
    return Boolean(
      payment.providerReference &&
      payment.pixCopyPaste &&
      payment.pixQrCode &&
      payment.expiresAt &&
      payment.expiresAt.getTime() > now.getTime(),
    );
  }

  private getQrExpiration(now: Date, periodEndsAt: Date) {
    const expirationMs = Math.min(
      now.getTime() + PIX_QR_VALIDITY_MS,
      periodEndsAt.getTime(),
    );
    const expiresAt = new Date(Math.floor(expirationMs / 1_000) * 1_000);

    if (expiresAt.getTime() <= now.getTime()) {
      throw new ConflictException({
        code: 'PARTICIPATION_PERIOD_ENDED',
        message: 'O perÃ­odo mensal jÃ¡ foi encerrado.',
      });
    }

    return expiresAt;
  }

  private ensureValidCharge(
    charge: PixChargeResult,
    createdAt: Date,
    periodEndsAt: Date,
  ) {
    if (
      !charge.providerReference ||
      !charge.pixCopyPaste ||
      !charge.pixQrCode ||
      Number.isNaN(charge.expiresAt.getTime()) ||
      charge.expiresAt.getTime() <= createdAt.getTime() ||
      charge.expiresAt.getTime() > periodEndsAt.getTime()
    ) {
      throw new PixProviderRequestError('unknown');
    }
  }

  private toPixResponse(payment: PixPayment) {
    return {
      id: payment.id,
      status: this.getEffectiveStatus(payment),
      amountCents: payment.amountCents,
      currency: payment.currency,
      method: payment.method,
      pixCopyPaste: payment.pixCopyPaste,
      pixQrCode: payment.pixQrCode,
      expiresAt: payment.expiresAt,
    };
  }

  private toHistoryResponse(payment: HistoryPayment) {
    return {
      id: payment.id,
      period: payment.period,
      amountCents: payment.amountCents,
      currency: payment.currency,
      method: payment.method,
      status: this.getEffectiveStatus(payment),
      expiresAt: payment.expiresAt,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }

  private toStatusResponse(payment: StatusPayment) {
    return {
      id: payment.id,
      status: this.getEffectiveStatus(payment),
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
    };
  }

  private getEffectiveStatus(payment: {
    status: PaymentStatus;
    expiresAt: Date | null;
  }) {
    if (
      payment.status === PaymentStatus.PENDING &&
      payment.expiresAt &&
      payment.expiresAt.getTime() <= Date.now()
    ) {
      return PaymentStatus.EXPIRED;
    }

    return payment.status;
  }

  private ensureProviderIsConfigured() {
    if (!this.provider.isConfigured()) {
      throw new ServiceUnavailableException({
        code: 'PIX_PROVIDER_NOT_CONFIGURED',
        message:
          'A integraÃ§Ã£o PIX Sandbox estÃ¡ incompleta. Nenhum QR Code foi criado.',
      });
    }
  }

  private ensureFixedParticipationFee(feeCents: number) {
    if (feeCents !== MONTHLY_PARTICIPATION_FEE_CENTS) {
      throw new ServiceUnavailableException({
        code: 'INVALID_PARTICIPATION_FEE',
        message: 'O valor da participaÃ§Ã£o estÃ¡ inconsistente.',
      });
    }
  }

  private ensureWebhookMatches(
    payment: {
      amountCents: number;
      currency: string;
      method: PaymentMethod;
      provider: string;
      period: {
        participationFeeCents: number;
        status: ParticipationPeriodStatus;
      };
    },
    event: ReceivedWebhookEvent,
    providerName: string,
  ) {
    if (
      payment.provider !== providerName ||
      payment.method !== PaymentMethod.PIX ||
      payment.amountCents !== MONTHLY_PARTICIPATION_FEE_CENTS ||
      payment.period.participationFeeCents !==
        MONTHLY_PARTICIPATION_FEE_CENTS ||
      payment.period.status !== ParticipationPeriodStatus.OPEN ||
      payment.amountCents !== event.amountCents ||
      payment.currency !== event.currency
    ) {
      throw new BadRequestException({
        code: 'ASAAS_PAYMENT_MISMATCH',
        message: 'O pagamento recebido nÃ£o corresponde Ã  participaÃ§Ã£o.',
      });
    }
  }

  private ensureSameReceivedPayment(
    payment: {
      status: PaymentStatus;
      providerPaymentId: string | null;
      providerEventId: string | null;
    },
    event: ReceivedWebhookEvent,
  ) {
    if (
      payment.status !== PaymentStatus.PAID ||
      payment.providerPaymentId !== event.providerPaymentId ||
      payment.providerEventId !== event.providerEventId
    ) {
      throw new BadRequestException({
        code: 'ASAAS_PAYMENT_CONFLICT',
        message: 'O evento Asaas conflita com o pagamento jÃ¡ registrado.',
      });
    }
  }

  private creationInconclusive() {
    return new ServiceUnavailableException({
      code: 'PIX_CREATION_INCONCLUSIVE',
      message:
        'NÃ£o foi possÃ­vel confirmar a criaÃ§Ã£o do PIX. Tente novamente mais tarde.',
    });
  }

  private providerUnavailable() {
    return new ServiceUnavailableException({
      code: 'PIX_PROVIDER_UNAVAILABLE',
      message:
        'NÃ£o foi possÃ­vel criar o PIX agora. Tente novamente mais tarde.',
    });
  }

  private isConcurrencyConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    );
  }

  private isUniqueConstraintConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
