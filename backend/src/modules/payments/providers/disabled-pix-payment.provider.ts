import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  CreatePixChargeInput,
  PixPaymentProvider,
  PixWebhookRequest,
} from './pix-payment-provider.interface';

@Injectable()
export class DisabledPixPaymentProvider implements PixPaymentProvider {
  readonly name = 'unconfigured';

  isConfigured() {
    return false;
  }

  createPixCharge(input: CreatePixChargeInput): Promise<never> {
    void input;
    throw this.notConfigured();
  }

  verifyWebhook(request: PixWebhookRequest): Promise<never> {
    void request;
    throw this.notConfigured();
  }

  private notConfigured() {
    return new ServiceUnavailableException({
      code: 'PIX_PROVIDER_NOT_CONFIGURED',
      message:
        'O provedor PIX ainda não foi configurado. Nenhuma cobrança foi criada.',
    });
  }
}
