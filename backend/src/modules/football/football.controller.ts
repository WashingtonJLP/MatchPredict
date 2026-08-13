import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FootballService } from './football.service';

@ApiTags('Football')
@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

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
