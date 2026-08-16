import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

import { EmailProvider, SendEmailParams } from './email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider, OnModuleInit {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    this.port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    this.secure =
      this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    this.user = this.configService.get<string>('SMTP_USER', '').trim();
    this.from = this.configService
      .get<string>('EMAIL_FROM', 'MatchPredict <matchpredict.app@gmail.com>')
      .trim();
    const password = this.configService.get<string>('SMTP_PASSWORD', '');

    this.transporter = createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: password,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log(
        `Conexão SMTP verificada host=${this.host} port=${this.port} user=${this.user}`,
      );
    } catch (error) {
      this.logSmtpError('Falha ao verificar conexão SMTP.', error);
    }
  }

  async sendEmail({ html, subject, to }: SendEmailParams) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logSmtpError('Falha ao enviar e-mail via SMTP.', error);

      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de redefinição de senha.',
      );
    }
  }

  private logSmtpError(message: string, error: unknown) {
    const smtpError = this.normalizeSmtpError(error);

    this.logger.error(
      [
        message,
        `host=${this.host}`,
        `port=${this.port}`,
        `user=${this.user}`,
        `code=${smtpError.code}`,
        `responseCode=${smtpError.responseCode}`,
        `error=${smtpError.message}`,
      ].join(' '),
      smtpError.stack,
    );
  }

  private normalizeSmtpError(error: unknown) {
    if (error instanceof Error) {
      const details = error as Error & {
        code?: string;
        responseCode?: number;
      };

      return {
        code: details.code ?? 'UNKNOWN',
        message: details.message,
        responseCode: details.responseCode ?? 'UNKNOWN',
        stack: details.stack,
      };
    }

    return {
      code: 'UNKNOWN',
      message: String(error),
      responseCode: 'UNKNOWN',
      stack: undefined,
    };
  }
}
