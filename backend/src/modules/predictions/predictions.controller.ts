import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
import { PredictionProcessorService } from './prediction-processor.service';
import { PredictionsService } from './predictions.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Predictions')
@ApiBearerAuth()
@Controller('predictions')
export class PredictionsController {
  constructor(
    private readonly predictionsService: PredictionsService,
    private readonly predictionProcessorService: PredictionProcessorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar palpite para uma partida' })
  @ApiResponse({ status: 201, description: 'Palpite criado.' })
  @ApiResponse({ status: 409, description: 'Palpite duplicado ou tardio.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPredictionDto: CreatePredictionDto,
  ) {
    return this.predictionsService.create(user.id, createPredictionDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar meus palpites' })
  @ApiResponse({ status: 200, description: 'Lista de palpites do usuário.' })
  findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.predictionsService.findMy(user.id);
  }

  @Get('fixture/:fixtureId')
  @ApiOperation({ summary: 'Listar palpites de uma partida' })
  @ApiResponse({ status: 200, description: 'Lista de palpites da partida.' })
  @ApiResponse({ status: 404, description: 'Partida não encontrada.' })
  findByFixture(@Param('fixtureId') fixtureId: string) {
    return this.predictionsService.findByFixture(fixtureId);
  }

  @Post('calculate/:predictionId')
  @ApiOperation({ summary: 'Calcular pontuação de um palpite específico' })
  @ApiResponse({ status: 201, description: 'Palpite calculado.' })
  @ApiResponse({ status: 404, description: 'Palpite não encontrado.' })
  calculate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('predictionId') predictionId: string,
  ) {
    this.ensureAdmin(user);

    return this.predictionsService.calculatePrediction(predictionId);
  }

  @Post('process/:fixtureId')
  @ApiOperation({ summary: 'Processar todos os palpites de uma partida' })
  @ApiResponse({
    status: 201,
    description: 'Palpites e standings processados.',
  })
  @ApiResponse({ status: 400, description: 'Partida ainda não finalizada.' })
  processFixture(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fixtureId') fixtureId: string,
  ) {
    this.ensureAdmin(user);

    return this.predictionProcessorService.processFixture(fixtureId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um palpite próprio' })
  @ApiResponse({ status: 200, description: 'Palpite atualizado.' })
  @ApiResponse({
    status: 403,
    description: 'Palpite pertence a outro usuário.',
  })
  @ApiResponse({ status: 409, description: 'Partida já iniciada.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updatePredictionDto: UpdatePredictionDto,
  ) {
    return this.predictionsService.update(user.id, id, updatePredictionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um palpite próprio' })
  @ApiResponse({ status: 200, description: 'Palpite excluído.' })
  @ApiResponse({
    status: 403,
    description: 'Palpite pertence a outro usuário.',
  })
  @ApiResponse({ status: 409, description: 'Partida já iniciada.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.predictionsService.remove(user.id, id);
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
  }
}
