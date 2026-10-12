import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  PaymentStatus,
  ParticipationStatus,
  Prisma,
  Role,
} from '@prisma/client';
import {
  buildStandingPositionMap,
  standingRankingOrderBy,
} from '../../common/prisma/query-presets';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getParticipationPeriodForDate } from '../participations/participation-period';
import { AdminPaginationQueryDto } from './dto/admin-pagination-query.dto';
import { AdminParticipationsQueryDto } from './dto/admin-participations-query.dto';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';
import {
  AdminAccountStatus,
  AdminUsersQueryDto,
} from './dto/admin-users-query.dto';

type AdminDatabaseClient = PrismaService | Prisma.TransactionClient;

type DeletionBlocker = {
  code: string;
  message: string;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(now = new Date()) {
    const descriptor = getParticipationPeriodForDate(now);
    const currentPeriodWhere = {
      referenceYear: descriptor.referenceYear,
      referenceMonth: descriptor.referenceMonth,
    };
    const [
      registeredUsers,
      activeParticipations,
      receivedPayments,
      financialReviews,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.participation.count({
        where: {
          status: ParticipationStatus.ACTIVE,
          period: currentPeriodWhere,
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: descriptor.startsAt,
            lt: descriptor.endsAt,
          },
        },
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      this.prisma.payment.count({
        where: this.financialReviewWhere(),
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          adminUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      period: descriptor,
      registeredUsers,
      activeParticipations,
      receivedPayments: receivedPayments._count._all,
      receivedAmountCents: receivedPayments._sum.amountCents ?? 0,
      financialReviews,
      recentActivity,
    };
  }

  getPeriods() {
    return this.prisma.participationPeriod.findMany({
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
      take: 24,
      select: {
        id: true,
        referenceYear: true,
        referenceMonth: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });
  }

  async getUsers(query: AdminUsersQueryDto, now = new Date()) {
    const { page, limit, skip } = this.pagination(query);
    const descriptor = getParticipationPeriodForDate(now);
    const where: Prisma.UserWhereInput = {
      role: query.role,
      disabledAt:
        query.accountStatus === AdminAccountStatus.ACTIVE
          ? null
          : query.accountStatus === AdminAccountStatus.DISABLED
            ? { not: null }
            : undefined,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          disabledAt: true,
          createdAt: true,
          participations: {
            where: {
              period: {
                referenceYear: descriptor.referenceYear,
                referenceMonth: descriptor.referenceMonth,
              },
            },
            take: 1,
            select: {
              status: true,
              activatedAt: true,
            },
          },
          payments: {
            where: {
              period: {
                referenceYear: descriptor.referenceYear,
                referenceMonth: descriptor.referenceMonth,
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              amountCents: true,
              paidAt: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return this.paginated(
      users.map(({ participations, payments, ...user }) => ({
        ...user,
        currentParticipation: participations[0] ?? null,
        currentPayment: payments[0] ?? null,
      })),
      page,
      limit,
      total,
    );
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        disabledAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            predictions: true,
            standings: true,
            participations: true,
            payments: true,
            adminAuditLogs: true,
          },
        },
        participations: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true,
            status: true,
            activatedAt: true,
            createdAt: true,
            period: {
              select: {
                id: true,
                referenceYear: true,
                referenceMonth: true,
              },
            },
            payment: {
              select: {
                id: true,
                status: true,
                amountCents: true,
                paidAt: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            amountCents: true,
            currency: true,
            method: true,
            status: true,
            provider: true,
            paidAt: true,
            expiresAt: true,
            createdAt: true,
            period: {
              select: {
                id: true,
                referenceYear: true,
                referenceMonth: true,
              },
            },
          },
        },
        standings: {
          orderBy: { season: { year: 'desc' } },
          take: 5,
          select: {
            id: true,
            totalPoints: true,
            exactScores: true,
            correctWinners: true,
            season: {
              select: {
                id: true,
                name: true,
                year: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.standings.length === 0) {
      return user;
    }

    const orderedStandings = await this.prisma.standing.findMany({
      where: {
        seasonId: {
          in: user.standings.map((standing) => standing.season.id),
        },
      },
      orderBy: standingRankingOrderBy,
      select: {
        id: true,
        seasonId: true,
      },
    });
    const positions = buildStandingPositionMap(orderedStandings);

    return {
      ...user,
      standings: user.standings.map((standing) => ({
        ...standing,
        position: positions.get(standing.id)!,
      })),
    };
  }

  getUserDeletionImpact(adminUserId: string, targetUserId: string) {
    return this.readDeletionImpact(this.prisma, adminUserId, targetUserId);
  }

  async deleteUser(
    adminUserId: string,
    targetUserId: string,
    confirmation: string,
  ) {
    if (confirmation !== 'EXCLUIR') {
      throw new ConflictException('Confirmação de exclusão inválida.');
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const impact = await this.readDeletionImpact(
            tx,
            adminUserId,
            targetUserId,
          );

          if (!impact.canDelete) {
            throw new ConflictException({
              code: 'USER_DELETION_BLOCKED',
              message: 'Este usuário não pode ser excluído definitivamente.',
              blockers: impact.blockers,
            });
          }

          await tx.participation.deleteMany({
            where: { userId: targetUserId, paymentId: null },
          });
          await tx.payment.deleteMany({
            where: {
              userId: targetUserId,
              status: {
                in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED],
              },
            },
          });
          await tx.prediction.deleteMany({ where: { userId: targetUserId } });
          await tx.standing.deleteMany({ where: { userId: targetUserId } });
          await tx.user.delete({ where: { id: targetUserId } });
          await tx.adminAuditLog.create({
            data: {
              adminUserId,
              action: AdminAuditAction.USER_DELETED,
              targetType: 'USER',
              targetId: targetUserId,
              metadata: {
                targetRole: impact.user.role,
                removedRecords: impact.counts,
              },
            },
          });

          return { message: 'Usuário excluído definitivamente.' };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2003', 'P2025', 'P2034'].includes(error.code)
      ) {
        throw new ConflictException({
          code: 'USER_DELETION_STATE_CHANGED',
          message:
            'O estado do usuário mudou durante a exclusão. Revise o impacto e tente novamente.',
        });
      }

      throw error;
    }
  }

  disableUser(adminUserId: string, targetUserId: string) {
    return this.setUserDisabledState(adminUserId, targetUserId, true);
  }

  reactivateUser(adminUserId: string, targetUserId: string) {
    return this.setUserDisabledState(adminUserId, targetUserId, false);
  }

  async getPayments(query: AdminPaymentsQueryDto) {
    const { page, limit, skip } = this.pagination(query);
    const where: Prisma.PaymentWhereInput = {
      status: query.status,
      periodId: query.periodId,
      user: query.user
        ? {
            OR: [
              { name: { contains: query.user, mode: 'insensitive' } },
              { email: { contains: query.user, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          amountCents: true,
          currency: true,
          method: true,
          status: true,
          provider: true,
          expiresAt: true,
          paidAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          period: {
            select: {
              id: true,
              referenceYear: true,
              referenceMonth: true,
            },
          },
          participation: { select: { id: true, status: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return this.paginated(payments, page, limit, total);
  }

  async getParticipations(query: AdminParticipationsQueryDto) {
    const { page, limit, skip } = this.pagination(query);
    const where: Prisma.ParticipationWhereInput = {
      status: query.status,
      periodId: query.periodId,
      user: query.user
        ? {
            OR: [
              { name: { contains: query.user, mode: 'insensitive' } },
              { email: { contains: query.user, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };
    const [participations, total] = await Promise.all([
      this.prisma.participation.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          activatedAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          period: {
            select: {
              id: true,
              referenceYear: true,
              referenceMonth: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              amountCents: true,
              paidAt: true,
            },
          },
        },
      }),
      this.prisma.participation.count({ where }),
    ]);

    return this.paginated(participations, page, limit, total);
  }

  async getFinancialReviews(query: AdminPaginationQueryDto) {
    const { page, limit, skip } = this.pagination(query);
    const where = this.financialReviewWhere();
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          amountCents: true,
          currency: true,
          status: true,
          provider: true,
          paidAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          period: {
            select: {
              id: true,
              referenceYear: true,
              referenceMonth: true,
            },
          },
          participation: { select: { id: true, status: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return this.paginated(
      payments.map((payment) => ({
        ...payment,
        reviewCode:
          payment.participation === null
            ? 'PAID_WITHOUT_PARTICIPATION'
            : 'PAID_WITHOUT_ACTIVE_PARTICIPATION',
      })),
      page,
      limit,
      total,
    );
  }

  async getAuditLogs(query: AdminPaginationQueryDto) {
    const { page, limit, skip } = this.pagination(query);
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
          adminUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);

    return this.paginated(logs, page, limit, total);
  }

  private async setUserDisabledState(
    adminUserId: string,
    targetUserId: string,
    disabled: boolean,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, role: true, disabledAt: true },
        });

        if (!target) {
          throw new NotFoundException('Usuário não encontrado.');
        }

        if (target.role === Role.ADMIN) {
          throw new ForbiddenException(
            'Contas administrativas não podem ser alteradas por este endpoint.',
          );
        }

        const isCurrentlyDisabled = target.disabledAt !== null;
        if (isCurrentlyDisabled === disabled) {
          throw new ConflictException(
            disabled ? 'A conta já está desativada.' : 'A conta já está ativa.',
          );
        }

        const disabledAt = disabled ? new Date() : null;
        const updatedUser = await tx.user.update({
          where: { id: targetUserId },
          data: disabled
            ? {
                disabledAt,
                authVersion: { increment: 1 },
                resetPasswordToken: null,
                resetPasswordExpiresAt: null,
              }
            : { disabledAt },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            disabledAt: true,
            createdAt: true,
          },
        });
        await tx.adminAuditLog.create({
          data: {
            adminUserId,
            action: disabled
              ? AdminAuditAction.USER_DISABLED
              : AdminAuditAction.USER_REACTIVATED,
            targetType: 'USER',
            targetId: targetUserId,
            metadata: disabled
              ? { disabledAt: disabledAt?.toISOString() }
              : { previousDisabledAt: target.disabledAt?.toISOString() },
          },
        });

        return updatedUser;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async readDeletionImpact(
    client: AdminDatabaseClient,
    adminUserId: string,
    targetUserId: string,
  ) {
    const user = await client.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabledAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const [
      predictions,
      standings,
      participations,
      payments,
      paymentGroups,
      linkedParticipations,
      activeParticipations,
      adminAuditLogs,
    ] = await Promise.all([
      client.prediction.count({ where: { userId: targetUserId } }),
      client.standing.count({ where: { userId: targetUserId } }),
      client.participation.count({ where: { userId: targetUserId } }),
      client.payment.count({ where: { userId: targetUserId } }),
      client.payment.groupBy({
        by: ['status'],
        where: { userId: targetUserId },
        _count: { _all: true },
      }),
      client.participation.count({
        where: { userId: targetUserId, paymentId: { not: null } },
      }),
      client.participation.count({
        where: {
          userId: targetUserId,
          status: ParticipationStatus.ACTIVE,
        },
      }),
      client.adminAuditLog.count({ where: { adminUserId: targetUserId } }),
    ]);
    const paymentStatusCounts = Object.fromEntries(
      paymentGroups.map((group) => [group.status, group._count._all]),
    ) as Partial<Record<PaymentStatus, number>>;
    const blockers: DeletionBlocker[] = [];

    if (adminUserId === targetUserId) {
      blockers.push({
        code: 'SELF_DELETION_FORBIDDEN',
        message: 'O administrador não pode excluir a própria conta.',
      });
    }
    if (user.role === Role.ADMIN) {
      blockers.push({
        code: 'ADMIN_DELETION_FORBIDDEN',
        message: 'Outro administrador não pode ser excluído por este fluxo.',
      });
    }
    if ((paymentStatusCounts.PAID ?? 0) > 0) {
      blockers.push({
        code: 'PAID_PAYMENT_EXISTS',
        message:
          'Existe pagamento pago e a rastreabilidade financeira deve ser preservada.',
      });
    }
    if ((paymentStatusCounts.PENDING ?? 0) > 0) {
      blockers.push({
        code: 'PENDING_PAYMENT_EXISTS',
        message: 'Existe cobrança pendente que ainda pode ser confirmada.',
      });
    }
    if ((paymentStatusCounts.EXPIRED ?? 0) > 0) {
      blockers.push({
        code: 'RECONCILABLE_EXPIRED_PAYMENT_EXISTS',
        message: 'Existe cobrança expirada ainda elegível à reconciliação.',
      });
    }
    if (linkedParticipations > 0) {
      blockers.push({
        code: 'PAYMENT_LINKED_PARTICIPATION_EXISTS',
        message:
          'Existe participação vinculada a pagamento e o histórico deve ser preservado.',
      });
    }
    if (activeParticipations > 0) {
      blockers.push({
        code: 'ACTIVE_PARTICIPATION_EXISTS',
        message:
          'Existe participação ativa e a conta deve ser desativada em vez de excluída.',
      });
    }
    if (adminAuditLogs > 0) {
      blockers.push({
        code: 'ADMIN_AUDIT_HISTORY_EXISTS',
        message:
          'Este usuário possui ações administrativas auditadas e esses logs não podem ser apagados.',
      });
    }

    return {
      user,
      counts: {
        predictions,
        standings,
        participations,
        payments,
        adminAuditLogs,
      },
      paymentStatusCounts,
      blockers,
      canDelete: blockers.length === 0,
      fallbackAction:
        blockers.length > 0 && user.role !== Role.ADMIN ? 'DISABLE' : null,
    };
  }

  private financialReviewWhere(): Prisma.PaymentWhereInput {
    return {
      status: PaymentStatus.PAID,
      OR: [
        { participation: { is: null } },
        {
          participation: {
            is: { status: { not: ParticipationStatus.ACTIVE } },
          },
        },
      ],
    };
  }

  private pagination(query: AdminPaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return { page, limit, skip: (page - 1) * limit };
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
