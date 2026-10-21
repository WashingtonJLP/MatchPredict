import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarStorage } from './avatar/avatar-storage';
import { R2AvatarStorage } from './avatar/r2-avatar-storage';
import { UserAvatarService } from './avatar/user-avatar.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserAvatarService,
    { provide: AvatarStorage, useClass: R2AvatarStorage },
  ],
  exports: [UsersService, UserAvatarService],
})
export class UsersModule {}
