import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  Logger,
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
  PixProviderPayment,
  PixProviderRequestError,
  PixWebhookRequest,
  VerifiedPixWebhookEvent,
} from './providers/pix-payment-provider.interface';

const PIX_QR_VALIDITY_MS = 30 * 60 * 1_000;
const RECONCILIATION_COOLDOWN_MS = 2 * 60 * 1_000;
const ASAAS_PAYMENT_STATUSES = new Set([
  'PENDING',
  'RECEIVED',
  'CONFIRMED',
  'OVERDUE',
  'REFUNDED',
  'RECEIVED_IN_CASH',
  'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS',
  'CHARGEBACK_REQUESTED',
  'CHARGEBACK_DISPUTE',
  'AWAITING_CHARGEBACK_REVERSAL',
  'DUNNING_REQUESTED',
  'DUNNING_RECEIVED',
  'AWAITING_RISK_ANALYSIS',
]);

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

const paymentReconciliationSelect = Prisma.validator<Prisma.PaymentSelect>()({
  id: true,
  userId: true,
  periodId: true,
  amountCents: true,
  currency: true,
  method: true,
  status: true,
  provider: true,
  providerReference: true,
  providerPaymentId: true,
  providerEventId: true,
  paidAt: true,
  period: {
    select: {
      participationFeeCents: true,
      status: true,
    },
  },
  participation: {
    select: {
      status: true,
      paymentId: true,
    },
  },
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
  private readonly logger = new Logger(PaymentsService.name);
  private readonly reconciliationAttempts = new Map<string, number>();

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
      where: { userId, status: PaymentStatus.PAID },
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
    const startedAt = Date.now();
    const requestId = this.readRequestId(request.headers);
    let event: VerifiedPixWebhookEvent | undefined;
    let localPaymentId: string | undefined;

    try {
      if (providerName !== this.provider.name) {
        throw new NotFoundException('Provedor de pagamento desconhecido.');
      }

      event = await this.provider.verifyWebhook(request);

      if (event.kind === 'ignored') {
        const result = { received: true, ignored: true };
        this.logWebhook({
          providerName,
          requestId,
          event,
          result: 'ignored',
          startedAt,
          httpStatus: 200,
        });
        return result;
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
          providerReference: true,
          period: {
            select: {
              participationFeeCents: true,
              status: true,
            },
          },
        },
      });

      if (!payment) {
        const result = { received: true, ignored: true };
        this.logWebhook({
          providerName,
          requestId,
          event,
          result: 'ignored',
          reason: 'payment_not_found',
          startedAt,
          httpStatus: 200,
        });
        return result;
      }

      localPaymentId = payment.id;
      this.ensureWebhookMatches(payment, event, providerName);
      const outcome = await this.finalizeReceivedPayment({
        paymentId: payment.id,
        providerPaymentId: event.providerPaymentId,
        providerEventId: event.providerEventId,
        paidAt: event.paidAt,
        source: 'webhook',
      });
      if (outcome === 'duplicate_financial') {
        throw this.duplicateFinancialPaymentConflict();
      }
      const result = {
        received: true,
        alreadyProcessed: outcome !== 'activated',
      };
      this.logWebhook({
        providerName,
        requestId,
        event,
        localPaymentId,
        result: outcome,
        startedAt,
        httpStatus: 200,
      });
      return result;
    } catch (error) {
      const normalizedError = this.normalizePaymentConflict(error);
      this.logWebhook({
        providerName,
        requestId,
        event,
        localPaymentId,
        result: 'rejected',
        reason: this.safeErrorCode(normalizedError),
        startedAt,
        httpStatus: this.httpStatus(normalizedError),
      });
      throw normalizedError;
    }
  }

  async reconcile(userId: string, paymentId: string) {
    const startedAt = Date.now();
    let result = 'provider_error';

    try {
      const payment = await this.prisma.payment.findFirst({
        where: { id: paymentId, userId },
        select: paymentReconciliationSelect,
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado.');
      }

      this.ensureReconciliationEligible(payment);

      if (payment.status === PaymentStatus.PAID) {
        this.ensureActiveParticipation(payment);
        result = 'already_paid';
        return { status: PaymentStatus.PAID, result, retryAfterSeconds: 0 };
      }

      this.enforceReconciliationCooldown(paymentId);
      this.pruneReconciliationCooldowns();
      this.reconciliationAttempts.set(paymentId, Date.now());

      const matches = await this.provider.findPaymentsByPixQrCodeId(
        payment.providerReference as string,
      );

      if (matches.length === 0) {
        result = 'not_received';
        return this.reconciliationPendingResponse(payment.status);
      }

      if (matches.length !== 1) {
        throw this.reconciliationConflict('ASAAS_PAYMENT_AMBIGUOUS');
      }

      const providerPayment = matches[0];
      this.ensureReconciliationMatches(payment, providerPayment);

      if (!ASAAS_PAYMENT_STATUSES.has(providerPayment.status)) {
        throw this.reconciliationConflict('ASAAS_PAYMENT_STATUS_INVALID');
      }

      if (providerPayment.status !== 'RECEIVED') {
        result = 'not_received';
        return this.reconciliationPendingResponse(payment.status);
      }

      const usedByAnotherPayment = await this.prisma.payment.findFirst({
        where: {
          providerPaymentId: providerPayment.providerPaymentId,
          id: { not: payment.id },
        },
        select: { id: true },
      });

      if (usedByAnotherPayment) {
        throw this.reconciliationConflict('ASAAS_PAYMENT_ID_ALREADY_USED');
      }

      const outcome = await this.finalizeReceivedPayment({
        paymentId: payment.id,
        providerPaymentId: providerPayment.providerPaymentId,
        providerEventId: null,
        paidAt: providerPayment.paidAt,
        source: 'reconciliation',
      });
      if (outcome === 'duplicate_financial') {
        throw this.duplicateFinancialPaymentConflict();
      }
      result = 'confirmed';
      return { status: PaymentStatus.PAID, result, retryAfterSeconds: 0 };
    } catch (error) {
      if (result === 'provider_error' && error instanceof BadRequestException) {
        result = 'conflict';
      }
      if (error instanceof PixProviderRequestError) {
        throw new ServiceUnavailableException({
          code: 'PIX_RECONCILIATION_UNAVAILABLE',
          message:
            'Não foi possível verificar o pagamento agora. Tente novamente em instantes.',
        });
      }
      throw this.normalizePaymentConflict(error);
    } finally {
      this.logger.log(
        JSON.stringify({
          type: 'payment_reconciliation',
          localPaymentId: paymentId,
          provider: this.provider.name,
          result,
          durationMs: Date.now() - startedAt,
        }),
      );
    }
  }

  private async finalizeReceivedPayment(input: {
    paymentId: string;
    providerPaymentId: string;
    providerEventId: string | null;
    paidAt: Date | null;
    source: 'webhook' | 'reconciliation';
  }): Promise<
    | 'activated'
    | 'duplicate'
    | 'reconciled_before_webhook'
    | 'duplicate_financial'
  > {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const current = await tx.payment.findUniqueOrThrow({
              where: { id: input.paymentId },
              select: paymentReconciliationSelect,
            });

            if (current.status === PaymentStatus.PAID) {
              this.ensureEquivalentPaidPayment(current, input);
              this.ensureActiveParticipation(current);

              if (input.providerEventId && !current.providerEventId) {
                const eventUpdate = await tx.payment.updateMany({
                  where: {
                    id: input.paymentId,
                    status: PaymentStatus.PAID,
                    providerPaymentId: input.providerPaymentId,
                    providerEventId: null,
                  },
                  data: { providerEventId: input.providerEventId },
                });

                if (eventUpdate.count === 0) {
                  const latest = await tx.payment.findUniqueOrThrow({
                    where: { id: input.paymentId },
                    select: paymentReconciliationSelect,
                  });
                  this.ensureEquivalentPaidPayment(latest, input);
                  this.ensureActiveParticipation(latest);
                  if (latest.providerEventId !== input.providerEventId) {
                    throw this.reconciliationConflict('ASAAS_PAYMENT_CONFLICT');
                  }
                }

                return 'reconciled_before_webhook';
              }

              return 'duplicate';
            }

            if (
              current.status !== PaymentStatus.PENDING &&
              current.status !== PaymentStatus.EXPIRED
            ) {
              throw new BadRequestException({
                code: 'PAYMENT_NOT_PAYABLE',
                message: 'O pagamento local não aceita confirmação.',
              });
            }

            if (current.participation) {
              throw this.reconciliationConflict(
                'PARTICIPATION_PAYMENT_CONFLICT',
              );
            }

            const periodParticipation = await tx.participation.findUnique({
              where: {
                userId_periodId: {
                  userId: current.userId,
                  periodId: current.periodId,
                },
              },
              select: {
                status: true,
                paymentId: true,
              },
            });

            const paidAt = input.paidAt ?? new Date();
            const transition = await tx.payment.updateMany({
              where: {
                id: input.paymentId,
                status: { in: [PaymentStatus.PENDING, PaymentStatus.EXPIRED] },
                providerPaymentId: null,
                providerEventId: null,
              },
              data: {
                providerPaymentId: input.providerPaymentId,
                providerEventId: input.providerEventId,
                status: PaymentStatus.PAID,
                paidAt,
              },
            });

            if (transition.count === 0) {
              const latest = await tx.payment.findUniqueOrThrow({
                where: { id: input.paymentId },
                select: paymentReconciliationSelect,
              });
              this.ensureEquivalentPaidPayment(latest, input);
              this.ensureActiveParticipation(latest);
              return input.source === 'webhook' && !latest.providerEventId
                ? 'reconciled_before_webhook'
                : 'duplicate';
            }

            if (
              periodParticipation &&
              periodParticipation.paymentId !== current.id
            ) {
              return 'duplicate_financial';
            }

            await tx.participation.create({
              data: {
                userId: current.userId,
                periodId: current.periodId,
                paymentId: current.id,
                status: ParticipationStatus.ACTIVE,
                activatedAt: paidAt,
              },
            });

            return 'activated';
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (attempt < 2 && this.isSerializationConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    throw this.reconciliationConflict('PAYMENT_CONCURRENCY_CONFLICT');
  }

  private duplicateFinancialPaymentConflict() {
    return new ConflictException({
      code: 'DUPLICATE_FINANCIAL_PAYMENT_REQUIRES_REVIEW',
      message: 'Outro pagamento já ativou a participação deste período.',
    });
  }

  private ensureReconciliationEligible(
    payment: Prisma.PaymentGetPayload<{
      select: typeof paymentReconciliationSelect;
    }>,
  ) {
    if (
      payment.provider !== this.provider.name ||
      payment.method !== PaymentMethod.PIX ||
      payment.currency !== PARTICIPATION_CURRENCY ||
      payment.amountCents !== MONTHLY_PARTICIPATION_FEE_CENTS ||
      payment.period.participationFeeCents !==
        MONTHLY_PARTICIPATION_FEE_CENTS ||
      payment.period.status !== ParticipationPeriodStatus.OPEN ||
      !payment.providerReference ||
      (payment.status !== PaymentStatus.PENDING &&
        payment.status !== PaymentStatus.EXPIRED &&
        payment.status !== PaymentStatus.PAID)
    ) {
      throw this.reconciliationConflict('PAYMENT_NOT_RECONCILABLE');
    }
  }

  private ensureReconciliationMatches(
    payment: Prisma.PaymentGetPayload<{
      select: typeof paymentReconciliationSelect;
    }>,
    providerPayment: PixProviderPayment,
  ) {
    if (
      providerPayment.billingType !== 'PIX' ||
      providerPayment.currency !== PARTICIPATION_CURRENCY ||
      providerPayment.amountCents !== payment.amountCents ||
      providerPayment.providerReference !== payment.providerReference ||
      providerPayment.externalReference !== payment.id ||
      !providerPayment.providerPaymentId
    ) {
      throw this.reconciliationConflict('ASAAS_PAYMENT_MISMATCH');
    }
  }

  private ensureEquivalentPaidPayment(
    payment: Prisma.PaymentGetPayload<{
      select: typeof paymentReconciliationSelect;
    }>,
    input: {
      providerPaymentId: string;
      providerEventId: string | null;
    },
  ) {
    if (
      payment.status !== PaymentStatus.PAID ||
      payment.providerPaymentId !== input.providerPaymentId ||
      (payment.providerEventId !== null &&
        input.providerEventId !== null &&
        payment.providerEventId !== input.providerEventId)
    ) {
      throw this.reconciliationConflict('ASAAS_PAYMENT_CONFLICT');
    }
  }

  private ensureActiveParticipation(payment: {
    id: string;
    participation: {
      status: ParticipationStatus;
      paymentId: string | null;
    } | null;
  }) {
    if (
      payment.participation?.status !== ParticipationStatus.ACTIVE ||
      payment.participation.paymentId !== payment.id
    ) {
      throw this.reconciliationConflict('PARTICIPATION_PAYMENT_CONFLICT');
    }
  }

  private enforceReconciliationCooldown(paymentId: string) {
    const lastAttempt = this.reconciliationAttempts.get(paymentId);
    const remainingMs = lastAttempt
      ? RECONCILIATION_COOLDOWN_MS - (Date.now() - lastAttempt)
      : 0;

    if (remainingMs > 0) {
      throw new HttpException(
        {
          code: 'PAYMENT_RECONCILIATION_COOLDOWN',
          message: 'Aguarde alguns instantes antes de verificar novamente.',
          retryAfterSeconds: Math.ceil(remainingMs / 1_000),
        },
        429,
      );
    }
  }

  private pruneReconciliationCooldowns() {
    if (this.reconciliationAttempts.size < 5_000) {
      return;
    }

    const expiredBefore = Date.now() - RECONCILIATION_COOLDOWN_MS;
    for (const [paymentId, attemptedAt] of this.reconciliationAttempts) {
      if (attemptedAt <= expiredBefore) {
        this.reconciliationAttempts.delete(paymentId);
      }
    }
  }

  private reconciliationPendingResponse(status: PaymentStatus) {
    return {
      status,
      result: 'not_received',
      retryAfterSeconds: RECONCILIATION_COOLDOWN_MS / 1_000,
    };
  }

  private reconciliationConflict(code: string) {
    return new BadRequestException({
      code,
      message: 'A cobrança do Asaas não corresponde ao pagamento registrado.',
    });
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
      createdAt: payment.createdAt,
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
          'A integraÃ§Ã£o PIX estÃ¡ incompleta. Nenhum QR Code foi criado.',
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
      providerReference: string | null;
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
      payment.providerReference !== event.providerReference ||
      payment.method !== PaymentMethod.PIX ||
      payment.currency !== PARTICIPATION_CURRENCY ||
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

  private normalizePaymentConflict(error: unknown) {
    if (this.isUniqueConstraintConflict(error)) {
      return this.reconciliationConflict('ASAAS_PAYMENT_CONFLICT');
    }

    return error;
  }

  private readRequestId(
    headers: Record<string, string | string[] | undefined>,
  ) {
    const entry = Object.entries(headers).find(
      ([name]) => name.toLowerCase() === 'x-request-id',
    )?.[1];
    return typeof entry === 'string' && entry.length <= 128 ? entry : undefined;
  }

  private logWebhook(input: {
    providerName: string;
    requestId?: string;
    event?: VerifiedPixWebhookEvent;
    localPaymentId?: string;
    result: string;
    reason?: string;
    startedAt: number;
    httpStatus: number;
  }) {
    const received =
      input.event?.kind === 'payment-received' ? input.event : undefined;
    this.logger.log(
      JSON.stringify({
        type: 'payment_webhook',
        provider: input.providerName,
        requestId: input.requestId,
        eventId: input.event?.providerEventId,
        eventType:
          input.event?.kind === 'ignored'
            ? input.event.eventType
            : 'PAYMENT_RECEIVED',
        providerPaymentId: received?.providerPaymentId,
        pixQrCodeId: received?.providerReference,
        localPaymentId: input.localPaymentId,
        result: input.result,
        reason: input.reason,
        httpStatus: input.httpStatus,
        durationMs: Date.now() - input.startedAt,
      }),
    );
  }

  private safeErrorCode(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        typeof response.code === 'string'
      ) {
        return response.code;
      }
    }
    return 'UNEXPECTED_ERROR';
  }

  private httpStatus(error: unknown) {
    return error instanceof HttpException ? error.getStatus() : 500;
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

  private isSerializationConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  private isUniqueConstraintConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
