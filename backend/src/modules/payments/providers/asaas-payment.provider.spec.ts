import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { AsaasPaymentProvider } from './asaas-payment.provider';
import { PixProviderRequestError } from './pix-payment-provider.interface';

const webhookToken = 'webhook-token-with-at-least-32-characters';

describe('AsaasPaymentProvider', () => {
  let post: jest.Mock;
  let provider: AsaasPaymentProvider;

  beforeEach(() => {
    post = jest.fn();
    provider = createProvider(validConfig, post);
  });

  it('considera configurado somente o ambiente Sandbox completo', () => {
    expect(provider.isConfigured()).toBe(true);
    expect(
      createProvider(
        { ...validConfig, ASAAS_PIX_ADDRESS_KEY: '' },
        post,
      ).isConfigured(),
    ).toBe(false);
    expect(
      createProvider(
        { ...validConfig, ASAAS_WEBHOOK_TOKEN: '' },
        post,
      ).isConfigured(),
    ).toBe(false);
    expect(
      createProvider(
        {
          ...validConfig,
          ASAAS_BASE_URL: 'https://forbidden-provider.example/v3',
          ASAAS_API_KEY: 'invalid-key-for-forbidden-host',
        },
        post,
      ).isConfigured(),
    ).toBe(false);
  });

  it('falha com mensagem segura quando a configuraÃ§Ã£o estÃ¡ incompleta', async () => {
    provider = createProvider(
      { ...validConfig, ASAAS_PIX_ADDRESS_KEY: '' },
      post,
    );

    await expect(provider.createPixCharge(createInput)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'PIX_PROVIDER_NOT_CONFIGURED',
      }),
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('continua autenticando webhook durante indisponibilidade da API de criaÃ§Ã£o', async () => {
    provider = createProvider(
      {
        ...validConfig,
        ASAAS_API_KEY: '',
        ASAAS_PIX_ADDRESS_KEY: '',
      },
      post,
    );

    expect(provider.isConfigured()).toBe(false);
    await expect(
      provider.verifyWebhook(receivedWebhook()),
    ).resolves.toMatchObject({
      kind: 'payment-received',
      providerReference: 'qr_123',
    });
  });

  it('cria QR estÃ¡tico individual com autenticaÃ§Ã£o e contrato oficial', async () => {
    post.mockReturnValue(
      of({
        data: staticQrResponse,
      } as AxiosResponse),
    );

    await expect(provider.createPixCharge(createInput)).resolves.toEqual({
      providerReference: 'qr_123',
      pixQrCode: 'base64-image',
      pixCopyPaste: 'pix-payload',
      expiresAt: createInput.expiresAt,
    });

    expect(post).toHaveBeenCalledWith(
      'https://api-sandbox.asaas.com/v3/pix/qrCodes/static',
      {
        addressKey: 'sandbox-pix-key',
        value: 25,
        format: 'ALL',
        allowsMultiplePayments: false,
        expirationDate: createInput.expiresAt.toISOString(),
        externalReference: localPaymentId,
        description: 'ParticipaÃ§Ã£o mensal 10/2026',
      },
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'MatchPredict/1.0 (Node.js; sandbox)',
          access_token: validConfig.ASAAS_API_KEY,
        },
        timeout: 15_000,
        maxRedirects: 0,
      }),
    );
  });

  it('rejeita webhook quando o backend nÃ£o estÃ¡ configurado para Sandbox', () => {
    provider = createProvider(
      { ...validConfig, ASAAS_BASE_URL: 'https://api.asaas.com/v3' },
      post,
    );

    expect(() => provider.verifyWebhook(receivedWebhook())).toThrow(
      ServiceUnavailableException,
    );
  });

  it('classifica timeout como inconclusivo e nÃ£o expÃµe a API Key', async () => {
    const axiosError = new AxiosError('timeout', 'ECONNABORTED');
    post.mockReturnValue(throwError(() => axiosError));

    let received: unknown;
    try {
      await provider.createPixCharge(createInput);
    } catch (error) {
      received = error;
    }

    expect(received).toBeInstanceOf(PixProviderRequestError);
    expect(received).toMatchObject({ outcome: 'unknown' });
    expect(JSON.stringify(received)).not.toContain(validConfig.ASAAS_API_KEY);
  });

  it('classifica erro HTTP definitivo sem repassar corpo ou credenciais', async () => {
    const response = {
      status: 400,
      data: {
        errors: [{ description: `segredo: ${validConfig.ASAAS_API_KEY}` }],
      },
    } as AxiosResponse;
    post.mockReturnValue(
      throwError(
        () =>
          new AxiosError(
            'bad request',
            undefined,
            undefined,
            undefined,
            response,
          ),
      ),
    );

    let received: unknown;
    try {
      await provider.createPixCharge(createInput);
    } catch (error) {
      received = error;
    }

    expect(received).toMatchObject({ outcome: 'definitive' });
    expect(JSON.stringify(received)).not.toContain(validConfig.ASAAS_API_KEY);
    expect(JSON.stringify(received)).not.toContain('segredo:');
  });

  it.each([500, 502, 503])(
    'trata HTTP %i como resultado inconclusivo sem retry interno',
    async (status) => {
      post.mockReturnValue(
        throwError(
          () =>
            new AxiosError(
              'upstream failure',
              undefined,
              undefined,
              undefined,
              { status } as AxiosResponse,
            ),
        ),
      );

      await expect(provider.createPixCharge(createInput)).rejects.toMatchObject(
        {
          outcome: 'unknown',
        },
      );
      expect(post).toHaveBeenCalledTimes(1);
    },
  );

  it('trata conexÃ£o interrompida como inconclusiva sem retry interno', async () => {
    post.mockReturnValue(
      throwError(() => new AxiosError('socket hang up', 'ECONNRESET')),
    );

    await expect(provider.createPixCharge(createInput)).rejects.toMatchObject({
      outcome: 'unknown',
    });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('trata resposta 2xx incompleta como resultado inconclusivo', async () => {
    post.mockReturnValue(of({ data: { id: 'qr_123' } } as AxiosResponse));

    await expect(provider.createPixCharge(createInput)).rejects.toMatchObject({
      outcome: 'unknown',
    });
  });

  it('rejeita webhook sem token ou com token incorreto', () => {
    expect(() =>
      provider.verifyWebhook(receivedWebhook({ headers: {} })),
    ).toThrow(UnauthorizedException);
    expect(() =>
      provider.verifyWebhook(
        receivedWebhook({
          headers: { 'asaas-access-token': 'x'.repeat(40) },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it.each([
    ['token vazio', ''],
    ['token parcialmente correto', `${webhookToken.slice(0, -1)}x`],
    ['header duplicado', [webhookToken, 'outro-token']],
  ])('rejeita webhook com %s', (_label, token) => {
    expect(() =>
      provider.verifyWebhook(
        receivedWebhook({ headers: { 'asaas-access-token': token } }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('normaliza PAYMENT_RECEIVED autenticado pelo pixQrCodeId', async () => {
    await expect(provider.verifyWebhook(receivedWebhook())).resolves.toEqual({
      kind: 'payment-received',
      providerEventId: 'evt_123',
      providerPaymentId: 'pay_123',
      providerReference: 'qr_123',
      amountCents: 2500,
      currency: 'BRL',
    });
  });

  it.each([
    ['body vazio', undefined],
    ['body null', null],
    ['body array', []],
  ])('rejeita %s', (_label, body) => {
    expect(() =>
      provider.verifyWebhook({
        headers: { 'asaas-access-token': webhookToken },
        body,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita evento ausente e PAYMENT_RECEIVED sem payment', () => {
    expect(() =>
      provider.verifyWebhook(
        receivedWebhook({ bodyOverrides: { event: undefined } }),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      provider.verifyWebhook(
        receivedWebhook({ bodyOverrides: { payment: undefined } }),
      ),
    ).toThrow(BadRequestException);
  });

  it('ignora evento desconhecido autenticado sem consultar dados financeiros', async () => {
    await expect(
      provider.verifyWebhook(receivedWebhook({ event: 'UNKNOWN_EVENT' })),
    ).resolves.toEqual({
      kind: 'ignored',
      providerEventId: 'evt_123',
      eventType: 'UNKNOWN_EVENT',
    });
  });

  it.each([
    ['PAYMENT_RECEIVED com status diferente', { status: 'CONFIRMED' }],
    ['PAYMENT_RECEIVED sem payment.id', { id: null }],
    ['PAYMENT_RECEIVED com valor invÃ¡lido', { value: -1 }],
  ])('rejeita %s', (_label, paymentOverrides) => {
    expect(() =>
      provider.verifyWebhook(receivedWebhook({ paymentOverrides })),
    ).toThrow(BadRequestException);
  });

  it.each([
    [
      'PAYMENT_RECEIVED de boleto',
      { billingType: 'BOLETO', pixQrCodeId: null, value: 30 },
    ],
    [
      'PAYMENT_RECEIVED de cartÃ£o',
      { billingType: 'CREDIT_CARD', pixQrCodeId: null },
    ],
    [
      'PAYMENT_RECEIVED de mÃ©todo desconhecido',
      { billingType: 'UNKNOWN', pixQrCodeId: null },
    ],
    ['PAYMENT_RECEIVED PIX sem pixQrCodeId', { pixQrCodeId: null }],
  ])(
    'autentica e ignora %s sem promover pagamento',
    async (_label, paymentOverrides) => {
      await expect(
        provider.verifyWebhook(receivedWebhook({ paymentOverrides })),
      ).resolves.toEqual({
        kind: 'ignored',
        providerEventId: 'evt_123',
        eventType: 'PAYMENT_RECEIVED',
      });
    },
  );

  it.each(['BOLETO', 'CREDIT_CARD', 'UNKNOWN'])(
    'rejeita %s suspeito quando carrega pixQrCodeId de um Payment conhecido',
    (billingType) => {
      expect(() =>
        provider.verifyWebhook(
          receivedWebhook({ paymentOverrides: { billingType } }),
        ),
      ).toThrow(BadRequestException);
    },
  );

  it('nÃ£o depende de externalReference para correlacionar o PIX', async () => {
    await expect(
      provider.verifyWebhook(
        receivedWebhook({
          paymentOverrides: { externalReference: 'incorreta' },
        }),
      ),
    ).resolves.toMatchObject({
      kind: 'payment-received',
      providerReference: 'qr_123',
    });
  });

  it.each([
    'PAYMENT_CREATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_OVERDUE',
    'PAYMENT_REFUNDED',
  ])('autentica e ignora %s sem promover pagamento', async (event) => {
    await expect(
      provider.verifyWebhook(receivedWebhook({ event })),
    ).resolves.toEqual({
      kind: 'ignored',
      providerEventId: 'evt_123',
      eventType: event,
    });
  });
});

const localPaymentId = '33333333-3333-4333-8333-333333333333';
const validConfig = {
  ASAAS_API_KEY: '$aact_hmlg_test-only-not-a-real-key',
  ASAAS_BASE_URL: 'https://api-sandbox.asaas.com/v3',
  ASAAS_PIX_ADDRESS_KEY: 'sandbox-pix-key',
  ASAAS_WEBHOOK_TOKEN: webhookToken,
};
const createInput = {
  amountCents: 2500,
  currency: 'BRL' as const,
  description: 'ParticipaÃ§Ã£o mensal 10/2026',
  externalReference: localPaymentId,
  expiresAt: new Date('2026-10-07T18:30:00.000Z'),
};
const staticQrResponse = {
  id: 'qr_123',
  encodedImage: 'base64-image',
  payload: 'pix-payload',
  expirationDate: createInput.expiresAt.toISOString(),
};

function createProvider(config: Record<string, string>, post: jest.Mock) {
  return new AsaasPaymentProvider(new ConfigService(config), {
    post,
  } as unknown as HttpService);
}

function receivedWebhook(
  overrides: {
    event?: string;
    headers?: Record<string, string | string[]>;
    paymentOverrides?: Record<string, unknown>;
    bodyOverrides?: Record<string, unknown>;
  } = {},
) {
  return {
    headers: overrides.headers ?? { 'asaas-access-token': webhookToken },
    body: {
      id: 'evt_123',
      event: overrides.event ?? 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        status: 'RECEIVED',
        billingType: 'PIX',
        pixQrCodeId: 'qr_123',
        value: 25,
        ...overrides.paymentOverrides,
      },
      ...overrides.bodyOverrides,
    },
  };
}
