import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DailyGamesService } from './daily-games.service';
import { DailyGamesQueryDto } from './dto/daily-games-query.dto';
import { DailyGamesResponseDto } from './dto/daily-games-response.dto';

@ApiTags('Football')
@Controller('football/daily-games')
export class DailyGamesController {
  constructor(private readonly dailyGamesService: DailyGamesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar jogos de futebol por data em America/Sao_Paulo',
  })
  @ApiOkResponse({
    description: 'Jogos agrupados por competicao.',
    type: DailyGamesResponseDto,
  })
  findDailyGames(@Query() query: DailyGamesQueryDto) {
    return this.dailyGamesService.findDailyGames(query.date);
  }
}
