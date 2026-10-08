export const PIX_PAYMENT_PROVIDER = Symbol('PIX_PAYMENT_PROVIDER');

export type CreatePixChargeInput = {
  amountCents: number;
  currency: 'BRL';
  description: string;
  externalReference: string;
  expiresAt: Date;
};

export type PixChargeResult = {
  providerReference: string;
  pixCopyPaste: string;
  pixQrCode: string;
  expiresAt: Date;
};

export type PixWebhookRequest = {
  headers: Record<string, string | string[] | undefined>;
  rawBody?: Buffer;
  body: unknown;
};

export type VerifiedPixWebhookEvent =
  | {
      kind: 'payment-received';
      providerEventId: string;
      providerPaymentId: string;
      providerReference: string;
      amountCents: number;
      currency: 'BRL';
    }
  | {
      kind: 'ignored';
      providerEventId?: string;
      eventType?: string;
    };

export class PixProviderRequestError extends Error {
  constructor(
    readonly outcome: 'definitive' | 'unknown',
    message = 'Falha segura na comunicaÃ§Ã£o com o provedor PIX.',
  ) {
    super(message);
    this.name = 'PixProviderRequestError';
  }
}

export interface PixPaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
  verifyWebhook(request: PixWebhookRequest): Promise<VerifiedPixWebhookEvent>;
}
