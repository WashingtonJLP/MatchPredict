import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
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
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.' })
  findFixtures(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FixtureQueryDto,
  ) {
    return this.footballService.findFixtures(user.id, query);
  }

  @Post('sync/league')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar liga e temporada ativa da ESPN' })
  @ApiResponse({ status: 201, description: 'Liga e temporada sincronizadas.' })
  syncLeague(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdmin(user);

    return this.footballService.syncLeague();
  }

  @Post('sync/teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar times da Premier League' })
  @ApiResponse({ status: 201, description: 'Times sincronizados.' })
  syncTeams(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdmin(user);

    return this.footballService.syncTeams();
  }

  @Post('sync/fixtures')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar fixtures da temporada ativa' })
  @ApiResponse({ status: 201, description: 'Fixtures sincronizadas.' })
  syncFixtures(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdmin(user);

    return this.footballService.syncFixtures();
  }

  @Post('sync/players')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar jogadores dos times cadastrados' })
  @ApiResponse({ status: 201, description: 'Jogadores sincronizados.' })
  syncPlayers(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdmin(user);

    return this.footballService.syncPlayers();
  }

  @Post('sync/results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar resultados das fixtures pendentes' })
  @ApiResponse({ status: 201, description: 'Resultados atualizados.' })
  syncResults(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdmin(user);

    return this.footballService.syncResults();
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
  }
}
