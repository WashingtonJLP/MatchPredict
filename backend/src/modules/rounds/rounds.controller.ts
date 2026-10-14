import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoundStatsParamsDto } from './dto/round-stats-params.dto';
import {
  RoundStatsResponseDto,
  RoundsCatalogResponseDto,
} from './dto/rounds-response.dto';
import { RoundsService } from './rounds.service';

@ApiTags('Rounds')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Listar competições, temporadas e rodadas persistidas',
  })
  @ApiOkResponse({ type: RoundsCatalogResponseDto })
  findCatalog() {
    return this.roundsService.findCatalog();
  }

  @Get(':competitionId/seasons/:seasonId/:round')
  @ApiOperation({ summary: 'Obter estatísticas de uma rodada' })
  @ApiOkResponse({ type: RoundStatsResponseDto })
  @ApiNotFoundResponse({
    description: 'Competição, temporada ou rodada não encontrada.',
  })
  findRoundStats(
    @CurrentUser() user: { id: string },
    @Param() params: RoundStatsParamsDto,
  ) {
    return this.roundsService.findRoundStats(
      user.id,
      params.competitionId,
      params.seasonId,
      params.round,
    );
  }
}
