import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ParticipationsModule } from '../participations/participations.module';
import { PaymentWebhooksController } from './payment-webhooks.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DisabledPixPaymentProvider } from './providers/disabled-pix-payment.provider';
import { AsaasPaymentProvider } from './providers/asaas-payment.provider';
import { PIX_PAYMENT_PROVIDER } from './providers/pix-payment-provider.interface';

@Module({
  imports: [HttpModule, PrismaModule, ParticipationsModule],
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [
    PaymentsService,
    DisabledPixPaymentProvider,
    AsaasPaymentProvider,
    {
      provide: PIX_PAYMENT_PROVIDER,
      useExisting: AsaasPaymentProvider,
    },
  ],
})
export class PaymentsModule {}
