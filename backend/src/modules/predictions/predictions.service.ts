import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FixtureStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { ParticipationsService } from '../participations/participations.service';
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

const transparencyPredictionSelect =
  Prisma.validator<Prisma.PredictionSelect>()({
    id: true,
    homeGoals: true,
    awayGoals: true,
    totalPoints: true,
    user: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
  });

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreEngine: ScoreEngineService,
    private readonly participationsService: ParticipationsService,
  ) {}

  async create(userId: string, createPredictionDto: CreatePredictionDto) {
    try {
      return await this.withFixtureTransaction(async (tx) => {
        const fixture = await this.lockFixtureOrFail(
          tx,
          createPredictionDto.fixtureId,
        );
        this.ensureFixtureIsOpenForPrediction(fixture);
        await this.participationsService.assertActiveForFixture(
          userId,
          fixture.kickoff,
          tx,
        );

        const existingPrediction = await tx.prediction.findUnique({
          where: { userId_fixtureId: { userId, fixtureId: fixture.id } },
        });
        if (existingPrediction) {
          throw new ConflictException(
            'Você já registrou um palpite para esta partida.',
          );
        }

        return tx.prediction.create({
          data: {
            userId,
            fixtureId: createPredictionDto.fixtureId,
            homeGoals: createPredictionDto.homeGoals,
            awayGoals: createPredictionDto.awayGoals,
          },
          include: predictionWithFixtureTeams.include,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Você já registrou um palpite para esta partida.',
        );
      }

      throw error;
    }
  }

  async findMy(userId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: predictionWithFixtureTeams.include,
    });

    return predictions.map(({ fixture, ...prediction }) => {
      const { apiFixtureId, ...fixtureData } = fixture;

      return {
        ...prediction,
        fixture: {
          ...fixtureData,
          sourceEventId: String(apiFixtureId),
        },
      };
    });
  }

  async findByFixture(userId: string, fixtureId: string) {
    const fixture = await this.findFixtureOrFail(fixtureId);

    return this.prisma.prediction.findMany({
      where: {
        fixtureId,
        userId: this.isFixtureClosedForPrediction(fixture) ? undefined : userId,
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

  async findFixtureTransparency(userId: string, fixtureId: string) {
    const fixture = await this.prisma.fixture.findUnique({
      where: {
        id: fixtureId,
      },
      select: {
        id: true,
        apiFixtureId: true,
        round: true,
        kickoff: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        processedAt: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!fixture) {
      throw new NotFoundException('Partida nÃ£o encontrada.');
    }

    const isClosedForPrediction = this.isFixtureClosedForPrediction(fixture);
    const finalResult =
      fixture.status === FixtureStatus.FT &&
      fixture.homeGoals !== null &&
      fixture.awayGoals !== null
        ? {
            homeGoals: fixture.homeGoals,
            awayGoals: fixture.awayGoals,
          }
        : null;

    const predictions = await this.prisma.prediction.findMany({
      where: {
        fixtureId,
        userId: isClosedForPrediction ? undefined : userId,
      },
      orderBy: [
        {
          user: {
            name: 'asc',
          },
        },
        {
          createdAt: 'asc',
        },
      ],
      select: transparencyPredictionSelect,
    });

    return {
      fixture: {
        id: fixture.id,
        sourceEventId: String(fixture.apiFixtureId),
        round: fixture.round,
        kickoff: fixture.kickoff,
        status: fixture.status,
        processedAt: fixture.processedAt,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
      },
      isClosedForPrediction,
      finalResult,
      predictions,
    };
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

    return this.withFixtureTransaction(async (tx) => {
      // This lookup acquires no row lock. All write locks follow Fixture -> Prediction.
      const prediction = await this.findOwnedPredictionOrFail(
        userId,
        predictionId,
        tx,
      );
      const fixture = await this.lockFixtureOrFail(tx, prediction.fixtureId);
      this.ensureFixtureIsOpenForPrediction(fixture);
      await this.participationsService.assertActiveForFixture(
        userId,
        fixture.kickoff,
        tx,
      );

      try {
        return await tx.prediction.update({
          where: { id: prediction.id, userId, fixtureId: fixture.id },
          data: {
            homeGoals: updatePredictionDto.homeGoals,
            awayGoals: updatePredictionDto.awayGoals,
          },
          include: predictionWithFixtureTeams.include,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Palpite não encontrado.');
        }
        throw error;
      }
    });
  }

  async remove(userId: string, predictionId: string) {
    const prediction = await this.findOwnedPredictionOrFail(
      userId,
      predictionId,
    );

    this.ensureFixtureIsOpenForPrediction(prediction.fixture);

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
    db: Pick<Prisma.TransactionClient, 'prediction'> = this.prisma,
  ) {
    const prediction = await db.prediction.findUnique({
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

  private async withFixtureTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Transaction-local only; a busy fixture must not occupy a connection indefinitely.
          await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
          return operation(tx);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 2_000,
          timeout: 5_000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' ||
          error.code === 'P2028' ||
          (error.code === 'P2010' &&
            ['55P03', '40P01', '57014'].includes(String(error.meta?.code))))
      ) {
        throw new ConflictException('Partida em atualização. Tente novamente.');
      }
      throw error;
    }
  }

  private async lockFixtureOrFail(
    tx: Prisma.TransactionClient,
    fixtureId: string,
  ) {
    const [fixture] = await tx.$queryRaw<
      Array<{ id: string; kickoff: Date; status: FixtureStatus }>
    >`
      SELECT id, kickoff, status FROM fixtures WHERE id = ${fixtureId}::uuid FOR SHARE
    `;
    if (!fixture) {
      throw new NotFoundException('Partida não encontrada.');
    }
    return fixture;
  }

  private ensureFixtureIsOpenForPrediction(fixture: {
    kickoff: Date;
    status: FixtureStatus;
  }) {
    if (this.isFixtureClosedForPrediction(fixture)) {
      throw new ConflictException(
        'Não é possível registrar, alterar ou excluir palpites após o início da partida.',
      );
    }
  }

  private isFixtureClosedForPrediction(fixture: {
    kickoff: Date;
    status: FixtureStatus;
  }) {
    return (
      fixture.kickoff.getTime() <= Date.now() ||
      fixture.status === FixtureStatus.LIVE ||
      fixture.status === FixtureStatus.FT
    );
  }
}
