import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';

const predictionWithFixtureTeams =
  Prisma.validator<Prisma.PredictionDefaultArgs>()({
    include: {
      fixture: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
  });

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreEngine: ScoreEngineService,
  ) {}

  async create(userId: string, createPredictionDto: CreatePredictionDto) {
    const fixture = await this.findFixtureOrFail(createPredictionDto.fixtureId);

    this.ensureFixtureHasNotStarted(fixture.kickoff);

    const existingPrediction = await this.prisma.prediction.findUnique({
      where: {
        userId_fixtureId: {
          userId,
          fixtureId: createPredictionDto.fixtureId,
        },
      },
    });

    if (existingPrediction) {
      throw new ConflictException(
        'Você já registrou um palpite para esta partida.',
      );
    }

    return this.prisma.prediction.create({
      data: {
        userId,
        fixtureId: createPredictionDto.fixtureId,
        homeGoals: createPredictionDto.homeGoals,
        awayGoals: createPredictionDto.awayGoals,
      },
      include: predictionWithFixtureTeams.include,
    });
  }

  async findMy(userId: string) {
    return this.prisma.prediction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: predictionWithFixtureTeams.include,
    });
  }

  async findByFixture(fixtureId: string) {
    await this.findFixtureOrFail(fixtureId);

    return this.prisma.prediction.findMany({
      where: {
        fixtureId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(
    userId: string,
    predictionId: string,
    updatePredictionDto: UpdatePredictionDto,
  ) {
    if (
      updatePredictionDto.homeGoals === undefined &&
      updatePredictionDto.awayGoals === undefined
    ) {
      throw new BadRequestException(
        'Informe homeGoals ou awayGoals para atualizar o palpite.',
      );
    }

    const prediction = await this.findOwnedPredictionOrFail(
      userId,
      predictionId,
    );

    this.ensureFixtureHasNotStarted(prediction.fixture.kickoff);

    return this.prisma.prediction.update({
      where: {
        id: prediction.id,
      },
      data: {
        homeGoals: updatePredictionDto.homeGoals,
        awayGoals: updatePredictionDto.awayGoals,
      },
      include: predictionWithFixtureTeams.include,
    });
  }

  async remove(userId: string, predictionId: string) {
    const prediction = await this.findOwnedPredictionOrFail(
      userId,
      predictionId,
    );

    this.ensureFixtureHasNotStarted(prediction.fixture.kickoff);

    await this.prisma.prediction.delete({
      where: {
        id: prediction.id,
      },
    });

    return {
      message: 'Palpite excluído com sucesso.',
    };
  }

  async calculatePrediction(predictionId: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: {
        id: predictionId,
      },
      include: {
        fixture: true,
      },
    });

    if (!prediction) {
      throw new NotFoundException('Palpite não encontrado.');
    }

    const score = this.scoreEngine.calculate(
      {
        homeGoals: prediction.homeGoals,
        awayGoals: prediction.awayGoals,
      },
      {
        homeGoals: prediction.fixture.homeGoals,
        awayGoals: prediction.fixture.awayGoals,
      },
    );

    return this.prisma.prediction.update({
      where: {
        id: prediction.id,
      },
      data: score,
      include: predictionWithFixtureTeams.include,
    });
  }

  private async findFixtureOrFail(fixtureId: string) {
    const fixture = await this.prisma.fixture.findUnique({
      where: {
        id: fixtureId,
      },
    });

    if (!fixture) {
      throw new NotFoundException('Partida não encontrada.');
    }

    return fixture;
  }

  private async findOwnedPredictionOrFail(
    userId: string,
    predictionId: string,
  ) {
    const prediction = await this.prisma.prediction.findUnique({
      where: {
        id: predictionId,
      },
      include: {
        fixture: true,
      },
    });

    if (!prediction) {
      throw new NotFoundException('Palpite não encontrado.');
    }

    if (prediction.userId !== userId) {
      throw new ForbiddenException('Você não pode alterar este palpite.');
    }

    return prediction;
  }

  private ensureFixtureHasNotStarted(kickoff: Date) {
    if (kickoff.getTime() <= Date.now()) {
      throw new ConflictException(
        'Não é possível registrar, alterar ou excluir palpites após o início da partida.',
      );
    }
  }
}
