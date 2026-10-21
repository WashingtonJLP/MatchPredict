import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AdminAuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AvatarStorage } from './avatar-storage';
import { validateAvatar } from './avatar-validation';

@Injectable()
export class UserAvatarService {
  private readonly logger = new Logger(UserAvatarService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: AvatarStorage,
  ) {}

  private async current(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true, avatarUrl: true },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');
    return user;
  }

  private async cleanup(userId: string, key: string | null) {
    // Never derive deletion targets from a URL or a client-supplied filename.
    if (
      !key ||
      !key.startsWith(`avatars/${userId}/`) ||
      !/^avatars\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(key)
    )
      return;
    try {
      await this.storage.delete(key);
    } catch {
      this.logger.warn(
        'Falha ao limpar objeto de avatar; referência válida preservada.',
      );
    }
  }

  async upload(userId: string, file?: Express.Multer.File) {
    const extension = validateAvatar(file);
    const previous = await this.current(userId);
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;
    const avatarUrl = await this.storage.upload(
      key,
      file!.buffer,
      file!.mimetype,
    );
    try {
      const result = await this.prisma.user.updateMany({
        where: { id: userId, ...previous },
        data: { avatarUrl, avatarKey: key },
      });
      if (result.count !== 1)
        throw new ConflictException(
          'A foto foi alterada em outra sessão. Tente novamente.',
        );
    } catch (error) {
      await this.cleanup(userId, key);
      throw error;
    }
    await this.cleanup(userId, previous.avatarKey);
    return { avatarUrl };
  }

  async remove(userId: string) {
    const previous = await this.current(userId);
    await this.detach(userId, previous, this.prisma);
    await this.cleanup(userId, previous.avatarKey);
    return { avatarUrl: null };
  }

  async removeByAdmin(adminUserId: string, userId: string) {
    // Commit the reference removal and existing AuditLog atomically, before storage I/O.
    const previousKey = await this.prisma.$transaction(async (tx) => {
      const previous = await tx.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true, avatarKey: true },
      });
      if (!previous) throw new NotFoundException('Usuário não encontrado.');
      await this.detach(userId, previous, tx);
      await tx.adminAuditLog.create({
        data: {
          adminUserId,
          action: AdminAuditAction.USER_AVATAR_REMOVED,
          targetType: 'USER',
          targetId: userId,
          metadata: {
            hadAvatar:
              previous.avatarUrl !== null || previous.avatarKey !== null,
          },
        },
      });
      return previous.avatarKey;
    });
    await this.cleanup(userId, previousKey);
    return { avatarUrl: null };
  }

  private async detach(
    userId: string,
    previous: { avatarUrl: string | null; avatarKey: string | null },
    client: Pick<Prisma.TransactionClient, 'user'>,
  ) {
    if (previous.avatarUrl === null && previous.avatarKey === null) return;
    const result = await client.user.updateMany({
      where: { id: userId, ...previous },
      data: { avatarUrl: null, avatarKey: null },
    });
    if (result.count !== 1)
      throw new ConflictException(
        'A foto foi alterada em outra sessão. Tente novamente.',
      );
  }
}
