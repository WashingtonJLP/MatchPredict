import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRequiredConfigValue } from '../../common/config/security-config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    EmailModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: getRequiredConfigValue(configService, 'JWT_SECRET'),

        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN')!,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [JwtModule],
})
export class AuthModule {}
