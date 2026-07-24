import { Controller, Get, Post } from '@nestjs/common';
import { FootballService } from './football.service';

@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('leagues')
  getLeagues() {
    return this.footballService.getLeagues();
  }

  @Post('sync/league')
  syncLeague() {
    return this.footballService.syncLeague();
  }

  @Post('sync/teams')
  syncTeams() {
    return this.footballService.syncTeams();
  }
}