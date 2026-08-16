import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  activeSeasonWhere,
  latestCreatedOrderBy,
  publicUserSelect,
  standingRankingOrderBy,
} from '../../common/prisma/query-presets';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

type RoundPoints = {
  round: number;
  points: number;
};

type StandingSummary = {
  totalPoints: number;
  correctWinners: number;
  exactScores: number;
  wrongPredictions: number;
};

type PredictionRoundPointsSource = {
  totalPoints: number;
  fixture: {
    round: number;
  };
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const email = this.normalizeEmail(createUserDto.email);
    const userAlreadyExists = await this.findByEmail(email);

    if (userAlreadyExists) {
      throw new ConflictException('Já existe um usuário com esse e-mail.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.name) {
      data.name = updateUserDto.name;
    }

    if (updateUserDto.newPassword) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException(
          'Informe a senha atual para alterar a senha.',
        );
      }

      const passwordMatch = await bcrypt.compare(
        updateUserDto.currentPassword,
        user.password,
      );

      if (!passwordMatch) {
        throw new UnauthorizedException('Senha atual incorreta.');
      }

      data.password = await bcrypt.hash(updateUserDto.newPassword, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: this.normalizeEmail(email),
          mode: 'insensitive',
        },
      },
    });
  }

  async findMyStatistics(userId: string) {
    const activeSeasonId = await this.findActiveSeasonIdOrFail();
    const [standing, predictions, orderedStandings] = await Promise.all([
      this.findUserStandingSummary(activeSeasonId, userId),
      this.findUserPredictionRoundPoints(activeSeasonId, userId),
      this.findOrderedStandingUsers(activeSeasonId),
    ]);

    const totalPredictions = predictions.length;
    const totalPoints = standing?.totalPoints ?? 0;
    const correctWinners = standing?.correctWinners ?? 0;
    const exactScores = standing?.exactScores ?? 0;
    const wrongPredictions = standing?.wrongPredictions ?? 0;
    const roundPoints = this.groupPredictionPointsByRound(predictions);

    return {
      totalPredictions,
      totalPoints,
      averagePoints: this.roundToTwoDecimals(
        totalPredictions === 0 ? 0 : totalPoints / totalPredictions,
      ),
      accuracy: this.roundToTwoDecimals(
        totalPredictions === 0
          ? 0
          : (correctWinners / totalPredictions) * 100,
      ),
      correctWinners,
      exactScores,
      wrongPredictions,
      bestRound: this.findBestRound(roundPoints),
      worstRound: this.findWorstRound(roundPoints),
      currentPosition: this.findCurrentPosition(orderedStandings, userId),
    };
  }

  private findUserStandingSummary(
    seasonId: string,
    userId: string,
  ): Promise<StandingSummary | null> {
    return this.prisma.standing.findUnique({
      where: {
        seasonId_userId: {
          seasonId,
          userId,
        },
      },
      select: {
        totalPoints: true,
        correctWinners: true,
        exactScores: true,
        wrongPredictions: true,
      },
    });
  }

  private findUserPredictionRoundPoints(
    seasonId: string,
    userId: string,
  ): Promise<PredictionRoundPointsSource[]> {
    return this.prisma.prediction.findMany({
      where: {
        userId,
        fixture: {
          seasonId,
        },
      },
      select: {
        totalPoints: true,
        fixture: {
          select: {
            round: true,
          },
        },
      },
    });
  }

  private findOrderedStandingUsers(
    seasonId: string,
  ): Promise<Array<{ userId: string }>> {
    return this.prisma.standing.findMany({
      where: {
        seasonId,
      },
      orderBy: standingRankingOrderBy,
      select: {
        userId: true,
      },
    });
  }

  private async findActiveSeasonIdOrFail(): Promise<string> {
    const season = await this.prisma.season.findFirst({
      where: activeSeasonWhere,
      orderBy: latestCreatedOrderBy,
      select: {
        id: true,
      },
    });

    if (!season) {
      throw new NotFoundException('Temporada ativa nao encontrada.');
    }

    return season.id;
  }

  private groupPredictionPointsByRound(
    predictions: PredictionRoundPointsSource[],
  ): RoundPoints[] {
    const pointsByRound = new Map<number, number>();

    for (const prediction of predictions) {
      const round = prediction.fixture.round;
      const currentPoints = pointsByRound.get(round) ?? 0;

      pointsByRound.set(round, currentPoints + prediction.totalPoints);
    }

    return [...pointsByRound.entries()].map(([round, points]) => ({
      round,
      points,
    }));
  }

  private findBestRound(roundPoints: RoundPoints[]): RoundPoints | null {
    return this.findRoundByPoints(roundPoints, 'best');
  }

  private findWorstRound(roundPoints: RoundPoints[]): RoundPoints | null {
    return this.findRoundByPoints(roundPoints, 'worst');
  }

  private findCurrentPosition(
    standings: Array<{ userId: string }>,
    userId: string,
  ): number | null {
    const index = standings.findIndex((standing) => standing.userId === userId);

    return index === -1 ? null : index + 1;
  }

  private findRoundByPoints(
    roundPoints: RoundPoints[],
    direction: 'best' | 'worst',
  ): RoundPoints | null {
    if (roundPoints.length === 0) {
      return null;
    }

    return roundPoints.reduce((selectedRound, currentRound) => {
      if (
        direction === 'best' &&
        currentRound.points > selectedRound.points
      ) {
        return currentRound;
      }

      if (
        direction === 'worst' &&
        currentRound.points < selectedRound.points
      ) {
        return currentRound;
      }

      if (
        currentRound.points === selectedRound.points &&
        currentRound.round < selectedRound.round
      ) {
        return currentRound;
      }

      return selectedRound;
    });
  }

  private roundToTwoDecimals(value: number): number {
    return Number(value.toFixed(2));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
