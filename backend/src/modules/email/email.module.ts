import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import { SmtpEmailProvider } from './providers/smtp-email.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    SmtpEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, SmtpEmailProvider],
      useFactory: (
        configService: ConfigService,
        smtpEmailProvider: SmtpEmailProvider,
      ) => {
        const provider = configService.get<string>('EMAIL_PROVIDER', 'smtp');

        if (provider !== 'smtp') {
          throw new Error(`Provedor de e-mail não suportado: ${provider}`);
        }

        return smtpEmailProvider;
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
