import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Listar meu histórico de pagamentos' })
  @ApiResponse({
    status: 200,
    description: 'Histórico do usuário autenticado.',
  })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findMine(user.id);
  }

  @Get('me/current-pix')
  @ApiOperation({ summary: 'Retomar meu PIX mensal pendente e vÃ¡lido' })
  findCurrentPix(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findCurrentPix(user.id);
  }

  @Get(':paymentId/status')
  @ApiOperation({ summary: 'Consultar status de uma cobrança própria' })
  findStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId', new ParseUUIDPipe({ version: '4' })) paymentId: string,
  ) {
    return this.paymentsService.findStatus(user.id, paymentId);
  }

  @Post('pix')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Criar ou retomar cobrança PIX mensal' })
  @ApiResponse({ status: 201, description: 'Dados necessários para pagar.' })
  createPix(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.createPix(user);
  }
}
