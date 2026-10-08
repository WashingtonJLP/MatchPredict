import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParticipationsService } from './participations.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Participations')
@ApiBearerAuth()
@Controller('participations')
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Get('me/current')
  @ApiOperation({ summary: 'Consultar participação mensal vigente' })
  @ApiResponse({ status: 200, description: 'Situação da participação atual.' })
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.participationsService.findCurrentForUser(user.id);
  }
}
