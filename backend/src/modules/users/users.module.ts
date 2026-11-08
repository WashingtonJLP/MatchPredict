import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarStorage } from './avatar/avatar-storage';
import { CloudinaryAvatarStorage } from './avatar/cloudinary-avatar-storage';
import { UserAvatarService } from './avatar/user-avatar.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserAvatarService,
    { provide: AvatarStorage, useClass: CloudinaryAvatarStorage },
  ],
  exports: [UsersService, UserAvatarService],
})
export class UsersModule {}
