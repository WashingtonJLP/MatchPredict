import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyStandingResponseDto } from './dto/my-standing-response.dto';
import { StandingResponseDto } from './dto/standing-response.dto';
import { StandingsService } from './standings.service';

@ApiTags('Standings')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ranking da temporada ativa' })
  @ApiOkResponse({
    description: 'Ranking da temporada ativa.',
    type: StandingResponseDto,
    isArray: true,
  })
  findActiveSeasonRanking() {
    return this.standingsService.findActiveSeasonRanking();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter posição do usuário autenticado na temporada ativa',
  })
  @ApiOkResponse({
    description: 'Posição do usuário autenticado no ranking.',
    type: MyStandingResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.' })
  findMyActiveSeasonStanding(@CurrentUser() user: { id: string }) {
    return this.standingsService.findMyActiveSeasonStanding(user.id);
  }
}
