import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { createHash, timingSafeEqual } from 'node:crypto';
import { firstValueFrom } from 'rxjs';
import {
  CreatePixChargeInput,
  PixChargeResult,
  PixPaymentProvider,
  PixProviderRequestError,
  PixWebhookRequest,
  VerifiedPixWebhookEvent,
} from './pix-payment-provider.interface';

const ASAAS_SANDBOX_BASE_URL = 'https://api-sandbox.asaas.com/v3';
const ASAAS_PRODUCTION_BASE_URL = 'https://api.asaas.com/v3';
const ASAAS_SANDBOX_API_KEY_PREFIX = '$aact_hmlg_';
const ASAAS_PRODUCTION_API_KEY_PREFIX = '$aact_prod_';
const ASAAS_REQUEST_TIMEOUT_MS = 15_000;

type AsaasEnvironment = 'sandbox' | 'production';

type AsaasStaticQrCodeResponse = {
  id?: unknown;
  encodedImage?: unknown;
  payload?: unknown;
  expirationDate?: unknown;
};

@Injectable()
export class AsaasPaymentProvider implements PixPaymentProvider {
  readonly name = 'asaas';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  isConfigured() {
    const apiKey = this.readConfig('ASAAS_API_KEY');
    const environment = this.configuredEnvironment(apiKey);
    const addressKey = this.readConfig('ASAAS_PIX_ADDRESS_KEY');
    const webhookToken = this.readConfig('ASAAS_WEBHOOK_TOKEN');

    return Boolean(
      environment &&
      addressKey &&
      webhookToken &&
      webhookToken.length >= 32 &&
      webhookToken.length <= 255 &&
      !/\s/.test(webhookToken) &&
      webhookToken !== apiKey,
    );
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult> {
    this.assertConfigured();

    const apiKey = this.readConfig('ASAAS_API_KEY') as string;
    const addressKey = this.readConfig('ASAAS_PIX_ADDRESS_KEY') as string;
    const baseUrl = this.normalizedBaseUrl();
    const environment = this.configuredEnvironment(apiKey) as AsaasEnvironment;

    try {
      const response = await firstValueFrom(
        this.http.post<AsaasStaticQrCodeResponse>(
          `${baseUrl}/pix/qrCodes/static`,
          {
            addressKey,
            value: input.amountCents / 100,
            format: 'ALL',
            allowsMultiplePayments: false,
            expirationDate: input.expiresAt.toISOString(),
            externalReference: input.externalReference,
            description: input.description,
          },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': `MatchPredict/1.0 (Node.js; ${environment})`,
              access_token: apiKey,
            },
            timeout: ASAAS_REQUEST_TIMEOUT_MS,
            maxRedirects: 0,
          },
        ),
      );

      return this.parseStaticQrCode(response.data, input.expiresAt);
    } catch (error) {
      if (error instanceof PixProviderRequestError) {
        throw error;
      }

      throw new PixProviderRequestError(
        this.isDefinitiveFailure(error) ? 'definitive' : 'unknown',
      );
    }
  }

  verifyWebhook(request: PixWebhookRequest): Promise<VerifiedPixWebhookEvent> {
    this.assertWebhookConfigured();
    this.assertWebhookToken(request.headers);

    if (!isRecord(request.body)) {
      throw this.invalidWebhook('Payload do webhook Asaas invÃ¡lido.');
    }

    const providerEventId = readNonEmptyString(request.body.id);
    const eventType = readNonEmptyString(request.body.event);

    if (!eventType) {
      throw this.invalidWebhook('Evento do webhook Asaas invÃ¡lido.');
    }

    if (eventType !== 'PAYMENT_RECEIVED') {
      return Promise.resolve({
        kind: 'ignored',
        providerEventId: providerEventId ?? undefined,
        eventType,
      });
    }

    if (!providerEventId || !isRecord(request.body.payment)) {
      throw this.invalidWebhook('Pagamento do webhook Asaas invÃ¡lido.');
    }

    const payment = request.body.payment;
    const providerPaymentId = readNonEmptyString(payment.id);
    const providerReference = readNonEmptyString(payment.pixQrCodeId);
    const status = readNonEmptyString(payment.status);
    const billingType = readNonEmptyString(payment.billingType);
    const value = payment.value;

    if (
      !providerPaymentId ||
      status !== 'RECEIVED' ||
      !billingType ||
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value <= 0 ||
      Math.abs(value * 100 - Math.round(value * 100)) > 1e-6
    ) {
      throw this.invalidWebhook('Pagamento recebido do Asaas inconsistente.');
    }

    if (billingType !== 'PIX' && providerReference) {
      throw this.invalidWebhook(
        'Pagamento relacionado ao PIX com mÃ©todo inconsistente.',
      );
    }

    if (billingType !== 'PIX' || !providerReference) {
      return Promise.resolve({
        kind: 'ignored',
        providerEventId,
        eventType,
      });
    }

    return Promise.resolve({
      kind: 'payment-received',
      providerEventId,
      providerPaymentId,
      providerReference,
      amountCents: Math.round(value * 100),
      currency: 'BRL',
    });
  }

  private parseStaticQrCode(
    data: AsaasStaticQrCodeResponse,
    requestedExpiration: Date,
  ): PixChargeResult {
    const providerReference = readNonEmptyString(data.id);
    const pixQrCode = readNonEmptyString(data.encodedImage);
    const pixCopyPaste = readNonEmptyString(data.payload);
    const expiresAt = parseDateTime(data.expirationDate);

    if (!providerReference || !pixQrCode || !pixCopyPaste) {
      throw new PixProviderRequestError('unknown');
    }

    return {
      providerReference,
      pixQrCode,
      pixCopyPaste,
      expiresAt: expiresAt ?? requestedExpiration,
    };
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException({
        code: 'PIX_PROVIDER_NOT_CONFIGURED',
        message:
          'A integraÃ§Ã£o PIX estÃ¡ incompleta. Nenhum QR Code foi criado.',
      });
    }
  }

  private assertWebhookConfigured() {
    const apiKey = this.readConfig('ASAAS_API_KEY');
    const webhookToken = this.readConfig('ASAAS_WEBHOOK_TOKEN');

    if (
      !this.configuredBaseUrlEnvironment() ||
      !webhookToken ||
      webhookToken.length < 32 ||
      webhookToken.length > 255 ||
      /\s/.test(webhookToken) ||
      webhookToken === apiKey
    ) {
      throw new ServiceUnavailableException({
        code: 'PIX_WEBHOOK_NOT_CONFIGURED',
        message: 'A autenticaÃ§Ã£o do webhook PIX estÃ¡ incompleta.',
      });
    }
  }

  private assertWebhookToken(
    headers: Record<string, string | string[] | undefined>,
  ) {
    const expected = this.readConfig('ASAAS_WEBHOOK_TOKEN') as string;
    const received = readHeader(headers, 'asaas-access-token');

    if (!received || !constantTimeEquals(received, expected)) {
      throw new UnauthorizedException({
        code: 'INVALID_ASAAS_WEBHOOK_TOKEN',
        message: 'Webhook Asaas nÃ£o autenticado.',
      });
    }
  }

  private isDefinitiveFailure(error: unknown) {
    if (!(error instanceof AxiosError) || !error.response) {
      return false;
    }

    const status = error.response.status;

    return (
      status >= 400 && status < 500 && ![408, 409, 425, 429].includes(status)
    );
  }

  private invalidWebhook(message: string) {
    return new BadRequestException({
      code: 'INVALID_ASAAS_WEBHOOK',
      message,
    });
  }

  private normalizedBaseUrl() {
    return this.readConfig('ASAAS_BASE_URL')?.replace(/\/+$/, '');
  }

  private configuredBaseUrlEnvironment(): AsaasEnvironment | undefined {
    const baseUrl = this.normalizedBaseUrl();

    if (baseUrl === ASAAS_SANDBOX_BASE_URL) {
      return 'sandbox';
    }

    if (baseUrl === ASAAS_PRODUCTION_BASE_URL) {
      return 'production';
    }

    return undefined;
  }

  private configuredEnvironment(
    apiKey: string | undefined,
  ): AsaasEnvironment | undefined {
    const environment = this.configuredBaseUrlEnvironment();

    if (
      environment === 'sandbox' &&
      hasApiKeyPrefix(apiKey, ASAAS_SANDBOX_API_KEY_PREFIX)
    ) {
      return environment;
    }

    if (
      environment === 'production' &&
      hasApiKeyPrefix(apiKey, ASAAS_PRODUCTION_API_KEY_PREFIX)
    ) {
      return environment;
    }

    return undefined;
  }

  private readConfig(name: string) {
    const value = this.config.get<string>(name);
    return value?.trim() || undefined;
  }
}

function hasApiKeyPrefix(apiKey: string | undefined, prefix: string) {
  return Boolean(apiKey?.startsWith(prefix) && apiKey.length > prefix.length);
}

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  expectedName: string,
) {
  const entries = Object.entries(headers).filter(
    ([name]) => name.toLowerCase() === expectedName,
  );

  if (entries.length !== 1 || Array.isArray(entries[0][1])) {
    return undefined;
  }

  return entries[0][1];
}

function constantTimeEquals(received: string, expected: string) {
  const receivedDigest = createHash('sha256').update(received).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();

  return timingSafeEqual(receivedDigest, expectedDigest);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseDateTime(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
