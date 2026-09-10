import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CompetitionsService } from './competitions.service';
import { CompetitionSeasonQueryDto } from './dto/competition-season-query.dto';

@ApiTags('Football Competitions')
@Controller('football/competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar competições e capacidades esportivas' })
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get(':id/seasons/current')
  @ApiOperation({ summary: 'Obter temporada atual e fases da competição' })
  findCurrentSeason(@Param('id') id: string) {
    return this.competitionsService.findCurrentSeason(id);
  }

  @Get(':id/standings')
  @ApiOperation({ summary: 'Obter classificação esportiva da competição' })
  findStandings(
    @Param('id') id: string,
    @Query() query: CompetitionSeasonQueryDto,
  ) {
    return this.competitionsService.findStandings(id, query.season);
  }

  @Get(':id/tournament')
  @ApiOperation({
    summary: 'Obter mata-mata da competição organizado por fases',
  })
  findTournament(
    @Param('id') id: string,
    @Query() query: CompetitionSeasonQueryDto,
  ) {
    return this.competitionsService.findTournament(id, query.season);
  }
}
