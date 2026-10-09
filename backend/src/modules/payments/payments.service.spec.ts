import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  ParticipationPeriodStatus,
  ParticipationStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ParticipationPeriodsService } from '../participations/participation-periods.service';
import { PaymentsService } from './payments.service';
import {
  PixPaymentProvider,
  PixProviderRequestError,
} from './providers/pix-payment-provider.interface';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let provider: jest.Mocked<PixPaymentProvider>;
  let providerIsConfigured: jest.Mock;
  let providerCreatePixCharge: jest.Mock;
  let providerVerifyWebhook: jest.Mock;
  let providerFindPayments: jest.Mock;
  let transaction: jest.Mock;
  let periodUpsert: jest.Mock;
  let paymentFindMany: jest.Mock;
  let paymentFindFirst: jest.Mock;
  let paymentFindUnique: jest.Mock;
  let paymentUpdate: jest.Mock;
  let paymentUpdateMany: jest.Mock;
  let txPaymentCreate: jest.Mock;
  let txPaymentFindFirst: jest.Mock;
  let txPaymentFindUniqueOrThrow: jest.Mock;
  let txPaymentUpdateMany: jest.Mock;
  let txParticipationFindUnique: jest.Mock;
  let txParticipationCreate: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    periodUpsert = jest.fn().mockResolvedValue(period);
    paymentFindMany = jest.fn();
    paymentFindFirst = jest.fn();
    paymentFindUnique = jest.fn();
    paymentUpdate = jest.fn();
    paymentUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    txPaymentCreate = jest.fn().mockResolvedValue(pendingPayment());
    txPaymentFindFirst = jest.fn().mockResolvedValue(null);
    txPaymentFindUniqueOrThrow = jest.fn();
    txPaymentUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    txParticipationFindUnique = jest.fn().mockResolvedValue(null);
    txParticipationCreate = jest.fn();

    const transactionClient = {
      payment: {
        create: txPaymentCreate,
        findFirst: txPaymentFindFirst,
        findUniqueOrThrow: txPaymentFindUniqueOrThrow,
        updateMany: txPaymentUpdateMany,
      },
      participation: {
        findUnique: txParticipationFindUnique,
        create: txParticipationCreate,
      },
    };
    transaction = jest.fn((callback: (tx: unknown) => unknown) =>
      callback(transactionClient),
    );
    prisma = {
      participationPeriod: {
        upsert: periodUpsert,
      },
      payment: {
        findMany: paymentFindMany,
        findFirst: paymentFindFirst,
        findUnique: paymentFindUnique,
        update: paymentUpdate,
        updateMany: paymentUpdateMany,
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    providerIsConfigured = jest.fn().mockReturnValue(true);
    providerCreatePixCharge = jest.fn();
    providerVerifyWebhook = jest.fn();
    providerFindPayments = jest.fn();
    provider = {
      name: 'asaas',
      isConfigured: providerIsConfigured,
      createPixCharge: providerCreatePixCharge,
      findPaymentsByPixQrCodeId: providerFindPayments,
      verifyWebhook: providerVerifyWebhook,
    };

    service = new PaymentsService(
      prisma,
      new ParticipationPeriodsService(prisma),
      provider,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria QR individual de R$ 25 com referÃªncia opaca e sem providerPaymentId', async () => {
    providerCreatePixCharge.mockResolvedValue(staticQrResult);
    paymentUpdate.mockResolvedValue(paymentWithQr());

    await expect(service.createPix(user)).resolves.toMatchObject({
      id: paymentId,
      status: PaymentStatus.PENDING,
      amountCents: 2500,
      pixCopyPaste: 'pix-payload',
      pixQrCode: 'base64-image',
    });

    expect(providerCreatePixCharge).toHaveBeenCalledWith({
      amountCents: 2500,
      currency: 'BRL',
      description: 'ParticipaÃ§Ã£o mensal 10/2026',
      externalReference: paymentId,
      expiresAt,
    });
    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          providerReference: 'qr_123',
          pixCopyPaste: 'pix-payload',
          pixQrCode: 'base64-image',
          expiresAt,
        },
      }),
    );
    expect(paymentUpdate.mock.calls[0][0].data).not.toHaveProperty(
      'providerPaymentId',
    );
    expect(txPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 2500 }),
      }),
    );
  });

  it('nÃ£o persiste Payment quando o provider nÃ£o estÃ¡ configurado', async () => {
    providerIsConfigured.mockReturnValue(false);

    await expect(service.createPix(user)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'PIX_PROVIDER_NOT_CONFIGURED',
      }),
    });
    expect(periodUpsert).not.toHaveBeenCalled();
    expect(txPaymentCreate).not.toHaveBeenCalled();
  });

  it('nÃ£o gera QR quando a participaÃ§Ã£o jÃ¡ estÃ¡ ativa', async () => {
    txParticipationFindUnique.mockResolvedValue({
      status: ParticipationStatus.ACTIVE,
    });

    await expect(service.createPix(user)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(providerCreatePixCharge).not.toHaveBeenCalled();
  });

  it('reutiliza QR PENDING vÃ¡lido sem chamar o Asaas novamente', async () => {
    txPaymentFindFirst.mockResolvedValue(paymentWithQr());

    await expect(service.createPix(user)).resolves.toMatchObject({
      id: paymentId,
      status: PaymentStatus.PENDING,
      pixCopyPaste: 'pix-payload',
    });
    expect(providerCreatePixCharge).not.toHaveBeenCalled();
    expect(txPaymentCreate).not.toHaveBeenCalled();
  });

  it('nÃ£o reutiliza QR expirado e cria nova tentativa local', async () => {
    txPaymentFindFirst.mockResolvedValue(null);
    txPaymentCreate.mockResolvedValue(pendingPayment({ id: retryPaymentId }));
    providerCreatePixCharge.mockResolvedValue({
      ...staticQrResult,
      providerReference: 'qr_retry',
    });
    paymentUpdate.mockResolvedValue(
      paymentWithQr({ id: retryPaymentId, providerReference: 'qr_retry' }),
    );

    await service.createPix(user);

    expect(txPaymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PaymentStatus.PENDING,
          expiresAt: { lte: now },
        }),
        data: { status: PaymentStatus.EXPIRED },
      }),
    );
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('reserva atomicamente a criaÃ§Ã£o e duplo clique chama o Asaas uma vez', async () => {
    txPaymentFindFirst.mockResolvedValue(pendingPayment());
    paymentUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    paymentFindUnique.mockResolvedValue(
      pendingPayment({ providerCreationStartedAt: now }),
    );

    let releaseProvider!: (value: typeof staticQrResult) => void;
    providerCreatePixCharge.mockReturnValue(
      new Promise((resolve) => {
        releaseProvider = resolve;
      }),
    );
    paymentUpdate.mockResolvedValue(paymentWithQr());

    const first = service.createPix(user);
    await Promise.resolve();
    const second = service.createPix(user);

    await expect(second).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PIX_CREATION_INCONCLUSIVE' }),
    });
    releaseProvider(staticQrResult);
    await expect(first).resolves.toMatchObject({ id: paymentId });
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('dez cliques concorrentes reservam somente uma criaÃ§Ã£o externa', async () => {
    txPaymentFindFirst.mockResolvedValue(pendingPayment());
    let claimed = false;
    paymentUpdateMany.mockImplementation(() => {
      if (claimed) {
        return Promise.resolve({ count: 0 });
      }

      claimed = true;
      return Promise.resolve({ count: 1 });
    });
    paymentFindUnique.mockResolvedValue(
      pendingPayment({ providerCreationStartedAt: now }),
    );

    let releaseProvider!: (value: typeof staticQrResult) => void;
    providerCreatePixCharge.mockReturnValue(
      new Promise((resolve) => {
        releaseProvider = resolve;
      }),
    );
    paymentUpdate.mockResolvedValue(paymentWithQr());

    const requests = Array.from({ length: 10 }, () => service.createPix(user));
    await Promise.resolve();
    releaseProvider(staticQrResult);
    const results = await Promise.allSettled(requests);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('mantÃ©m timeout inconclusivo bloqueado e nÃ£o faz retry cego', async () => {
    providerCreatePixCharge.mockRejectedValue(
      new PixProviderRequestError('unknown'),
    );

    await expect(service.createPix(user)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PIX_CREATION_INCONCLUSIVE' }),
    });

    txPaymentFindFirst.mockResolvedValue(
      pendingPayment({ providerCreationStartedAt: now }),
    );
    await expect(service.createPix(user)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PIX_CREATION_INCONCLUSIVE' }),
    });
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('limita a expiraÃ§Ã£o ao fim exclusivo do perÃ­odo', async () => {
    const shortPeriodEnd = new Date(now.getTime() + 5 * 60 * 1_000);
    periodUpsert.mockResolvedValue({ ...period, endsAt: shortPeriodEnd });
    providerCreatePixCharge.mockResolvedValue({
      ...staticQrResult,
      expiresAt: shortPeriodEnd,
    });
    paymentUpdate.mockResolvedValue(
      paymentWithQr({ expiresAt: shortPeriodEnd }),
    );

    await service.createPix(user);

    expect(providerCreatePixCharge).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: shortPeriodEnd }),
    );
  });

  it('bloqueia resultado cuja expiraÃ§Ã£o ultrapassa o perÃ­odo', async () => {
    providerCreatePixCharge.mockResolvedValue({
      ...staticQrResult,
      expiresAt: new Date(period.endsAt.getTime() + 1),
    });

    await expect(service.createPix(user)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PIX_CREATION_INCONCLUSIVE' }),
    });
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('marca falha definitiva de forma sanitizada e permite nova tentativa local', async () => {
    providerCreatePixCharge.mockRejectedValue(
      new PixProviderRequestError('definitive', 'internal-safe-only'),
    );

    await expect(service.createPix(user)).rejects.toMatchObject({
      response: {
        code: 'PIX_PROVIDER_UNAVAILABLE',
        message: expect.not.stringContaining('internal-safe-only'),
      },
    });
    expect(paymentUpdateMany).toHaveBeenLastCalledWith({
      where: {
        id: paymentId,
        status: PaymentStatus.PENDING,
        providerReference: null,
      },
      data: { status: PaymentStatus.FAILED },
    });
  });

  it('repete a transaÃ§Ã£o local apÃ³s conflito P2002 sem duplicar QR', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '6.19.3' },
    );
    const transactionClient = {
      payment: {
        create: txPaymentCreate,
        findFirst: txPaymentFindFirst,
        findUniqueOrThrow: txPaymentFindUniqueOrThrow,
        updateMany: txPaymentUpdateMany,
      },
      participation: {
        findUnique: txParticipationFindUnique,
        create: txParticipationCreate,
      },
    };
    transaction
      .mockRejectedValueOnce(conflict)
      .mockImplementation((callback: (tx: unknown) => unknown) =>
        callback(transactionClient),
      );
    providerCreatePixCharge.mockResolvedValue(staticQrResult);
    paymentUpdate.mockResolvedValue(paymentWithQr());

    await service.createPix(user);

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(providerCreatePixCharge).toHaveBeenCalledTimes(1);
  });

  it('PAYMENT_RECEIVED vÃ¡lido salva payment.id, marca PAID e ativa Participation', async () => {
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockResolvedValue(pendingWebhookPayment());

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: false });

    expect(txPaymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerPaymentId: 'pay_123',
          providerEventId: 'evt_123',
          status: PaymentStatus.PAID,
        }),
      }),
    );
    expect(txParticipationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ParticipationStatus.ACTIVE,
          paymentId,
        }),
      }),
    );
  });

  it('processa webhook autenticado mesmo se a API de criaÃ§Ã£o estiver indisponÃ­vel', async () => {
    providerIsConfigured.mockReturnValue(false);
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockResolvedValue(pendingWebhookPayment());

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: false });
    expect(txParticipationCreate).toHaveBeenCalledTimes(1);
  });

  it('webhook duplicado Ã© idempotente e nÃ£o duplica Participation', async () => {
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow
      .mockResolvedValueOnce(pendingWebhookPayment())
      .mockResolvedValueOnce({
        ...pendingWebhookPayment(),
        status: PaymentStatus.PAID,
        providerPaymentId: 'pay_123',
        providerEventId: 'evt_123',
        participation: {
          status: ParticipationStatus.ACTIVE,
          paymentId,
        },
      });

    await service.processWebhook('asaas', webhookRequest);
    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: true });

    expect(txParticipationCreate).toHaveBeenCalledTimes(1);
  });

  it('dez webhooks simultÃ¢neos ativam uma Ãºnica Participation', async () => {
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    let state: {
      status: PaymentStatus;
      providerPaymentId: string | null;
      providerEventId: string | null;
      userId: string;
      periodId: string;
      id: string;
      participation: {
        status: ParticipationStatus;
        paymentId: string;
      } | null;
    } = pendingWebhookPayment();

    txPaymentFindUniqueOrThrow.mockImplementation(() =>
      Promise.resolve({ ...state }),
    );
    txPaymentUpdateMany.mockImplementation(async () => {
      await Promise.resolve();

      if (state.status !== PaymentStatus.PENDING) {
        return { count: 0 };
      }

      state = {
        ...state,
        status: PaymentStatus.PAID,
        providerPaymentId: receivedEvent.providerPaymentId,
        providerEventId: receivedEvent.providerEventId,
        participation: {
          status: ParticipationStatus.ACTIVE,
          paymentId,
        },
      };
      return { count: 1 };
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        service.processWebhook('asaas', webhookRequest),
      ),
    );

    expect(results).toContainEqual({
      received: true,
      alreadyProcessed: false,
    });
    expect(
      results.filter(
        (result) =>
          'alreadyProcessed' in result && result.alreadyProcessed === true,
      ),
    ).toHaveLength(9);
    expect(txParticipationCreate).toHaveBeenCalledTimes(1);
  });

  it('ignora de forma segura evento irrelevante e pixQrCodeId desconhecido', async () => {
    providerVerifyWebhook.mockResolvedValue({
      kind: 'ignored',
      providerEventId: 'evt_created',
      eventType: 'PAYMENT_CREATED',
    });

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, ignored: true });
    expect(paymentFindFirst).not.toHaveBeenCalled();

    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(null);
    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, ignored: true });
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('nÃ£o ativa quando valor do webhook diverge de R$ 25', async () => {
    providerVerifyWebhook.mockResolvedValue({
      ...receivedEvent,
      amountCents: 2_600,
    });
    paymentFindFirst.mockResolvedValue(webhookPayment());

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it.each([2499, 2501, 0, -100, 3000])(
    'nÃ£o ativa quando o valor normalizado Ã© %i centavos',
    async (amountCents) => {
      providerVerifyWebhook.mockResolvedValue({
        ...receivedEvent,
        amountCents,
      });
      paymentFindFirst.mockResolvedValue(webhookPayment());

      await expect(
        service.processWebhook('asaas', webhookRequest),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(txPaymentUpdateMany).not.toHaveBeenCalled();
      expect(txParticipationCreate).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['provider local divergente', { provider: 'outro' }],
    ['mÃ©todo local divergente', { method: 'CARD' }],
    ['moeda local divergente', { currency: 'USD' }],
    [
      'taxa do perÃ­odo divergente',
      {
        period: {
          participationFeeCents: 3000,
          status: ParticipationPeriodStatus.OPEN,
        },
      },
    ],
    [
      'perÃ­odo fechado',
      {
        period: {
          participationFeeCents: 2500,
          status: ParticipationPeriodStatus.CLOSED,
        },
      },
    ],
  ])('rejeita webhook correlacionado com %s', async (_label, overrides) => {
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue({ ...webhookPayment(), ...overrides });

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it.each([PaymentStatus.CANCELLED, PaymentStatus.FAILED])(
    'nÃ£o regride estado terminal %s para PAID',
    async (status) => {
      providerVerifyWebhook.mockResolvedValue(receivedEvent);
      paymentFindFirst.mockResolvedValue(webhookPayment());
      txPaymentFindUniqueOrThrow.mockResolvedValue({
        ...pendingWebhookPayment(),
        status,
      });

      await expect(
        service.processWebhook('asaas', webhookRequest),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(txPaymentUpdateMany).not.toHaveBeenCalled();
      expect(txParticipationCreate).not.toHaveBeenCalled();
    },
  );

  it('rejeita conflito de payment.id/event.id em Payment jÃ¡ PAID', async () => {
    providerVerifyWebhook.mockResolvedValue({
      ...receivedEvent,
      providerPaymentId: 'pay_conflitante',
    });
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockResolvedValue({
      ...pendingWebhookPayment(),
      status: PaymentStatus.PAID,
      providerPaymentId: 'pay_123',
      providerEventId: 'evt_123',
    });

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('normaliza colisÃ£o de providerEventId/providerPaymentId sem ativar', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '6.19.3' },
    );
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    transaction.mockRejectedValueOnce(conflict);

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('rejeita provider desconhecido antes de validar qualquer evento', async () => {
    await expect(
      service.processWebhook('outro', webhookRequest),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(providerVerifyWebhook).not.toHaveBeenCalled();
  });

  it('retorna somente histÃ³rico do usuÃ¡rio e protege status por ownership', async () => {
    paymentFindMany.mockResolvedValue([]);
    await service.findMine(userId);
    expect(paymentFindMany).toHaveBeenCalledWith({
      where: { userId, status: PaymentStatus.PAID },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object),
    });
    const historySelect = paymentFindMany.mock.calls[0][0].select;
    expect(historySelect).not.toHaveProperty('pixCopyPaste');
    expect(historySelect).not.toHaveProperty('pixQrCode');

    paymentFindFirst.mockResolvedValue(null);
    await expect(service.findStatus(userId, paymentId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: paymentId, userId } }),
    );
    const statusSelect = paymentFindFirst.mock.calls.at(-1)?.[0].select;
    expect(statusSelect).not.toHaveProperty('pixCopyPaste');
    expect(statusSelect).not.toHaveProperty('pixQrCode');
    expect(statusSelect).not.toHaveProperty('period');
  });

  it('retoma o QR atual somente por leitura local sem consultar o Asaas', async () => {
    paymentFindFirst.mockResolvedValue(paymentWithQr());

    await expect(service.findCurrentPix(userId, now)).resolves.toMatchObject({
      id: paymentId,
      status: PaymentStatus.PENDING,
      pixCopyPaste: 'pix-payload',
    });
    expect(paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          status: PaymentStatus.PENDING,
          providerReference: { not: null },
          expiresAt: { gt: now },
        }),
      }),
    );
    expect(providerCreatePixCharge).not.toHaveBeenCalled();
    expect(providerVerifyWebhook).not.toHaveBeenCalled();
  });

  it.each([PaymentStatus.PENDING, PaymentStatus.EXPIRED])(
    'reconcilia Payment %s RECEIVED como PAID e ativa Participation',
    async (status) => {
      const local = reconciliationPayment({ status });
      paymentFindFirst.mockResolvedValueOnce(local).mockResolvedValueOnce(null);
      providerFindPayments.mockResolvedValue([providerReceivedPayment]);
      txPaymentFindUniqueOrThrow.mockResolvedValue(local);

      await expect(service.reconcile(userId, paymentId)).resolves.toEqual({
        status: PaymentStatus.PAID,
        result: 'confirmed',
        retryAfterSeconds: 0,
      });

      expect(providerFindPayments).toHaveBeenCalledWith('qr_123');
      expect(txPaymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerPaymentId: 'pay_123',
            providerEventId: null,
            status: PaymentStatus.PAID,
            paidAt: providerReceivedPayment.paidAt,
          }),
        }),
      );
      expect(txParticipationCreate).toHaveBeenCalledTimes(1);
    },
  );

  it('não ativa quando o Asaas ainda não possui cobrança recebida', async () => {
    paymentFindFirst.mockResolvedValue(reconciliationPayment());
    providerFindPayments.mockResolvedValue([]);

    await expect(service.reconcile(userId, paymentId)).resolves.toMatchObject({
      status: PaymentStatus.PENDING,
      result: 'not_received',
    });
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it.each([2, 3])(
    'rejeita resposta ambígua com %i cobranças',
    async (count) => {
      paymentFindFirst.mockResolvedValue(reconciliationPayment());
      providerFindPayments.mockResolvedValue(
        Array.from({ length: count }, (_, index) => ({
          ...providerReceivedPayment,
          providerPaymentId: `pay_${index}`,
        })),
      );

      await expect(service.reconcile(userId, paymentId)).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'ASAAS_PAYMENT_AMBIGUOUS' }),
      });
      expect(txPaymentUpdateMany).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['CANCELLED', { status: PaymentStatus.CANCELLED }],
    ['FAILED', { status: PaymentStatus.FAILED }],
    ['provider diferente', { provider: 'outro' }],
    ['moeda diferente', { currency: 'USD' }],
    ['sem providerReference', { providerReference: null }],
    [
      'período fechado',
      {
        period: {
          participationFeeCents: 2500,
          status: ParticipationPeriodStatus.CLOSED,
        },
      },
    ],
    [
      'taxa mensal divergente',
      {
        period: {
          participationFeeCents: 2600,
          status: ParticipationPeriodStatus.OPEN,
        },
      },
    ],
  ])('rejeita Payment local inconsistente: %s', async (_label, overrides) => {
    paymentFindFirst.mockResolvedValue(reconciliationPayment(overrides));

    await expect(service.reconcile(userId, paymentId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(providerFindPayments).not.toHaveBeenCalled();
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['valor', { amountCents: 2600 }],
    ['billingType', { billingType: 'BOLETO' }],
    ['pixQrCodeId', { providerReference: 'qr_outro' }],
    [
      'externalReference',
      { externalReference: '44444444-4444-4444-8444-444444444444' },
    ],
  ])('rejeita reconciliação com %s divergente', async (_field, overrides) => {
    paymentFindFirst.mockResolvedValue(reconciliationPayment());
    providerFindPayments.mockResolvedValue([
      { ...providerReceivedPayment, ...overrides },
    ]);

    await expect(service.reconcile(userId, paymentId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
  });

  it('rejeita providerPaymentId já usado por outro Payment', async () => {
    paymentFindFirst
      .mockResolvedValueOnce(reconciliationPayment())
      .mockResolvedValueOnce({ id: retryPaymentId });
    providerFindPayments.mockResolvedValue([providerReceivedPayment]);

    await expect(service.reconcile(userId, paymentId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
  });

  it('não permite reconciliar Payment de outro usuário', async () => {
    paymentFindFirst.mockResolvedValue(null);

    await expect(service.reconcile(userId, paymentId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(providerFindPayments).not.toHaveBeenCalled();
  });

  it('aplica cooldown após uma consulta ao Asaas', async () => {
    paymentFindFirst.mockResolvedValue(reconciliationPayment());
    providerFindPayments.mockResolvedValue([]);

    await service.reconcile(userId, paymentId);
    await expect(service.reconcile(userId, paymentId)).rejects.toMatchObject({
      status: 429,
    });
    expect(providerFindPayments).toHaveBeenCalledTimes(1);
  });

  it.each([10, 20])(
    'permite somente uma consulta ao Asaas em %i reconciliations simultâneas',
    async (requestCount) => {
      paymentFindFirst.mockResolvedValue(reconciliationPayment());
      let releaseProvider!: (value: []) => void;
      providerFindPayments.mockReturnValue(
        new Promise((resolve) => {
          releaseProvider = resolve;
        }),
      );

      const requests = Array.from({ length: requestCount }, () =>
        service.reconcile(userId, paymentId),
      );
      await Promise.resolve();
      releaseProvider([]);
      const results = await Promise.allSettled(requests);

      expect(providerFindPayments).toHaveBeenCalledTimes(1);
      expect(
        results.filter((item) => item.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.filter(
          (item) =>
            item.status === 'rejected' &&
            item.reason instanceof HttpException &&
            item.reason.getStatus() === 429,
        ),
      ).toHaveLength(requestCount - 1);
    },
  );

  it('rejeita status Asaas desconhecido como resposta inconsistente', async () => {
    paymentFindFirst.mockResolvedValue(reconciliationPayment());
    providerFindPayments.mockResolvedValue([
      { ...providerReceivedPayment, status: 'MYSTERY_STATUS' },
    ]);

    await expect(service.reconcile(userId, paymentId)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'ASAAS_PAYMENT_STATUS_INVALID',
      }),
    });
    expect(txPaymentUpdateMany).not.toHaveBeenCalled();
  });

  it('registra pagamento duplicado real sem substituir a Participation existente', async () => {
    const local = reconciliationPayment({
      id: retryPaymentId,
      providerReference: 'qr_retry',
    });
    const duplicateProviderPayment = {
      ...providerReceivedPayment,
      providerPaymentId: 'pay_retry',
      providerReference: 'qr_retry',
      externalReference: retryPaymentId,
    };
    paymentFindFirst.mockResolvedValueOnce(local).mockResolvedValueOnce(null);
    providerFindPayments.mockResolvedValue([duplicateProviderPayment]);
    txPaymentFindUniqueOrThrow.mockResolvedValue(local);
    txParticipationFindUnique.mockResolvedValue({
      status: ParticipationStatus.ACTIVE,
      paymentId,
    });

    await expect(
      service.reconcile(userId, retryPaymentId),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({
        code: 'DUPLICATE_FINANCIAL_PAYMENT_REQUIRES_REVIEW',
      }),
    });
    expect(txPaymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: retryPaymentId }),
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          providerPaymentId: 'pay_retry',
        }),
      }),
    );
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('webhook tardio preenche eventId após reconciliação sem alterar paidAt', async () => {
    const reconciled = reconciliationPayment({
      status: PaymentStatus.PAID,
      providerPaymentId: 'pay_123',
      providerEventId: null,
      paidAt: providerReceivedPayment.paidAt,
      participation: {
        status: ParticipationStatus.ACTIVE,
        paymentId,
      },
    });
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockResolvedValue(reconciled);

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: true });
    expect(txPaymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { providerEventId: 'evt_123' },
      }),
    );
    expect(txPaymentUpdateMany.mock.calls[0][0].data).not.toHaveProperty(
      'paidAt',
    );
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('repete webhook tardio como idempotente depois de preencher eventId', async () => {
    let state: Record<string, unknown> & {
      providerEventId: string | null;
    } = reconciliationPayment({
      status: PaymentStatus.PAID,
      providerPaymentId: 'pay_123',
      providerEventId: null,
      paidAt: providerReceivedPayment.paidAt,
      participation: {
        status: ParticipationStatus.ACTIVE,
        paymentId,
      },
    });
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockImplementation(() =>
      Promise.resolve({ ...state }),
    );
    txPaymentUpdateMany.mockImplementation(
      ({ data }: { data: { providerEventId?: string } }) => {
        if (data.providerEventId && state.providerEventId === null) {
          state = { ...state, providerEventId: data.providerEventId };
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      },
    );

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: true });
    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).resolves.toEqual({ received: true, alreadyProcessed: true });
    expect(state.providerEventId).toBe('evt_123');
    expect(txParticipationCreate).not.toHaveBeenCalled();
  });

  it('webhook tardio rejeita providerEventId conflitante', async () => {
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    paymentFindFirst.mockResolvedValue(webhookPayment());
    txPaymentFindUniqueOrThrow.mockResolvedValue(
      reconciliationPayment({
        status: PaymentStatus.PAID,
        providerPaymentId: 'pay_123',
        providerEventId: 'evt_outro',
        participation: {
          status: ParticipationStatus.ACTIVE,
          paymentId,
        },
      }),
    );

    await expect(
      service.processWebhook('asaas', webhookRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('dois webhooks e dez reconciliations concorrentes produzem uma única ativação', async () => {
    let state: Record<string, unknown> & {
      status: PaymentStatus;
      providerPaymentId: string | null;
      providerEventId: string | null;
      paidAt: Date | null;
      participation: {
        status: ParticipationStatus;
        paymentId: string;
      } | null;
    } = reconciliationPayment();
    paymentFindFirst.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if ('userId' in where) {
          return Promise.resolve(reconciliationPayment());
        }
        if (where.provider === 'asaas') {
          return Promise.resolve(webhookPayment());
        }
        return Promise.resolve(null);
      },
    );
    providerFindPayments.mockResolvedValue([providerReceivedPayment]);
    providerVerifyWebhook.mockResolvedValue(receivedEvent);
    txPaymentFindUniqueOrThrow.mockImplementation(() =>
      Promise.resolve({ ...state }),
    );
    txPaymentUpdateMany.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        if (data.status === PaymentStatus.PAID) {
          if (state.status !== PaymentStatus.PENDING) {
            return Promise.resolve({ count: 0 });
          }
          state = {
            ...state,
            status: PaymentStatus.PAID,
            providerPaymentId: data.providerPaymentId as string,
            providerEventId: data.providerEventId as string | null,
            paidAt: data.paidAt as Date,
            participation: {
              status: ParticipationStatus.ACTIVE,
              paymentId,
            },
          };
          return Promise.resolve({ count: 1 });
        }
        if (data.providerEventId && state.providerEventId === null) {
          state = {
            ...state,
            providerEventId: data.providerEventId as string,
          };
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      },
    );

    const results = await Promise.allSettled([
      ...Array.from({ length: 10 }, () => service.reconcile(userId, paymentId)),
      service.processWebhook('asaas', webhookRequest),
      service.processWebhook('asaas', webhookRequest),
    ]);

    expect(providerFindPayments).toHaveBeenCalledTimes(1);
    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(
      3,
    );
    expect(
      results.filter(
        (item) =>
          item.status === 'rejected' &&
          item.reason instanceof HttpException &&
          item.reason.getStatus() === 429,
      ),
    ).toHaveLength(9);
    expect(txParticipationCreate).toHaveBeenCalledTimes(1);
    expect(state).toMatchObject({
      status: PaymentStatus.PAID,
      providerPaymentId: 'pay_123',
      providerEventId: 'evt_123',
    });
  });

  it('histórico inclui Payment que se tornou PAID e exclui tentativas expiradas', async () => {
    paymentFindMany.mockResolvedValue([
      {
        ...paymentWithQr(),
        status: PaymentStatus.PAID,
        paidAt: now,
      },
    ]);

    await expect(service.findMine(userId)).resolves.toHaveLength(1);
    expect(paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, status: PaymentStatus.PAID },
      }),
    );
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
const periodId = '22222222-2222-4222-8222-222222222222';
const paymentId = '33333333-3333-4333-8333-333333333333';
const retryPaymentId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-10-07T18:00:00.000Z');
const expiresAt = new Date('2026-10-07T18:30:00.000Z');
const user: AuthenticatedUser = {
  id: userId,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: Role.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const period = {
  id: periodId,
  referenceYear: 2026,
  referenceMonth: 10,
  startsAt: new Date('2026-10-01T03:00:00.000Z'),
  endsAt: new Date('2026-11-01T03:00:00.000Z'),
  participationFeeCents: 2500,
  status: ParticipationPeriodStatus.OPEN,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
};
const staticQrResult = {
  providerReference: 'qr_123',
  pixCopyPaste: 'pix-payload',
  pixQrCode: 'base64-image',
  expiresAt,
};
const receivedEvent = {
  kind: 'payment-received' as const,
  providerEventId: 'evt_123',
  providerPaymentId: 'pay_123',
  providerReference: 'qr_123',
  amountCents: 2500,
  currency: 'BRL' as const,
  paidAt: null,
};
const webhookRequest = { headers: {}, body: {} };

function pendingPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: paymentId,
    amountCents: 2500,
    currency: 'BRL',
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING,
    providerPaymentId: null,
    providerReference: null,
    providerEventId: null,
    providerCreationStartedAt: null,
    pixCopyPaste: null,
    pixQrCode: null,
    expiresAt: null,
    paidAt: null,
    createdAt: now,
    period: {
      referenceYear: 2026,
      referenceMonth: 10,
      startsAt: period.startsAt,
      endsAt: period.endsAt,
    },
    ...overrides,
  };
}

function paymentWithQr(overrides: Record<string, unknown> = {}) {
  return pendingPayment({
    providerReference: 'qr_123',
    providerCreationStartedAt: now,
    pixCopyPaste: 'pix-payload',
    pixQrCode: 'base64-image',
    expiresAt,
    ...overrides,
  });
}

function webhookPayment() {
  return {
    id: paymentId,
    amountCents: 2500,
    currency: 'BRL',
    method: PaymentMethod.PIX,
    provider: 'asaas',
    providerReference: 'qr_123',
    period: {
      participationFeeCents: 2500,
      status: ParticipationPeriodStatus.OPEN,
    },
  };
}

function pendingWebhookPayment() {
  return {
    id: paymentId,
    status: PaymentStatus.PENDING,
    providerPaymentId: null,
    providerEventId: null,
    userId,
    periodId,
    participation: null,
  };
}

function reconciliationPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: paymentId,
    userId,
    periodId,
    amountCents: 2500,
    currency: 'BRL',
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING,
    provider: 'asaas',
    providerReference: 'qr_123',
    providerPaymentId: null,
    providerEventId: null,
    paidAt: null,
    period: {
      participationFeeCents: 2500,
      status: ParticipationPeriodStatus.OPEN,
    },
    participation: null,
    ...overrides,
  };
}

const providerReceivedPayment = {
  providerPaymentId: 'pay_123',
  providerReference: 'qr_123',
  externalReference: paymentId,
  status: 'RECEIVED',
  billingType: 'PIX',
  amountCents: 2500,
  currency: 'BRL' as const,
  paidAt: new Date('2026-10-07T00:00:00.000Z'),
};
