import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

@UseGuards(ThrottlerGuard)
@ApiTags('Payment webhooks')
@Controller('payments/webhook')
export class PaymentWebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Receber evento autenticado do provedor PIX' })
  receive(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() request: RawBodyRequest<Request>,
    @Body() body: unknown,
  ) {
    return this.paymentsService.processWebhook(provider, {
      headers,
      rawBody: request.rawBody,
      body,
    });
  }
}
