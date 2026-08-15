import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FixtureQueryDto } from './dto/fixture-query.dto';
import { FixtureListResponseDto } from './dto/fixture-response.dto';
import { FootballService } from './football.service';

@ApiTags('Football')
@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('fixtures')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar fixtures sincronizadas' })
  @ApiOkResponse({
    description: 'Fixtures paginadas da base local.',
    type: FixtureListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  findFixtures(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FixtureQueryDto,
  ) {
    return this.footballService.findFixtures(user.id, query);
  }

  @Post('sync/league')
  @ApiOperation({ summary: 'Sincronizar liga e temporada ativa da ESPN' })
  @ApiResponse({ status: 201, description: 'Liga e temporada sincronizadas.' })
  syncLeague() {
    return this.footballService.syncLeague();
  }

  @Post('sync/teams')
  @ApiOperation({ summary: 'Sincronizar times da Premier League' })
  @ApiResponse({ status: 201, description: 'Times sincronizados.' })
  syncTeams() {
    return this.footballService.syncTeams();
  }

  @Post('sync/fixtures')
  @ApiOperation({ summary: 'Sincronizar fixtures da temporada ativa' })
  @ApiResponse({ status: 201, description: 'Fixtures sincronizadas.' })
  syncFixtures() {
    return this.footballService.syncFixtures();
  }

  @Post('sync/players')
  @ApiOperation({ summary: 'Sincronizar jogadores dos times cadastrados' })
  @ApiResponse({ status: 201, description: 'Jogadores sincronizados.' })
  syncPlayers() {
    return this.footballService.syncPlayers();
  }

  @Post('sync/results')
  @ApiOperation({ summary: 'Atualizar resultados das fixtures pendentes' })
  @ApiResponse({ status: 201, description: 'Resultados atualizados.' })
  syncResults() {
    return this.footballService.syncResults();
  }
}
