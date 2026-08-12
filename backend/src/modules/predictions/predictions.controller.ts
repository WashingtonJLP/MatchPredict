import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
import { PredictionsService } from './predictions.service';

@UseGuards(JwtAuthGuard)
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createPredictionDto: CreatePredictionDto,
  ) {
    return this.predictionsService.create(user.id, createPredictionDto);
  }

  @Get('my')
  findMy(@CurrentUser() user: any) {
    return this.predictionsService.findMy(user.id);
  }

  @Get('fixture/:fixtureId')
  findByFixture(@Param('fixtureId') fixtureId: string) {
    return this.predictionsService.findByFixture(fixtureId);
  }

  @Post('calculate/:predictionId')
  calculate(@Param('predictionId') predictionId: string) {
    return this.predictionsService.calculatePrediction(predictionId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePredictionDto: UpdatePredictionDto,
  ) {
    return this.predictionsService.update(user.id, id, updatePredictionDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.predictionsService.remove(user.id, id);
  }
}
