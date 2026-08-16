import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { SmtpEmailProvider } from './smtp-email.provider';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SmtpEmailProvider', () => {
  let sendMail: jest.Mock;
  let verify: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(() => {
    sendMail = jest.fn();
    verify = jest.fn();
    (createTransport as jest.Mock).mockReturnValue({
      sendMail,
      verify,
    });
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates transporter with SMTP configuration', () => {
    createProvider();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'matchpredict.app@gmail.com',
        pass: 'app-password',
      },
    });
  });

  it('verifies SMTP connection on module init', async () => {
    verify.mockResolvedValue(true);
    const provider = createProvider();

    await provider.onModuleInit();

    expect(verify).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Conexão SMTP verificada'),
    );
  });

  it('logs SMTP verification errors without exposing password', async () => {
    const error = Object.assign(new Error('Invalid login'), {
      code: 'EAUTH',
      responseCode: 535,
    });
    verify.mockRejectedValue(error);
    const provider = createProvider();

    await provider.onModuleInit();

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('host=smtp.gmail.com'),
      expect.any(String),
    );
    expect(loggerErrorSpy.mock.calls[0][0]).toContain(
      'user=matchpredict.app@gmail.com',
    );
    expect(loggerErrorSpy.mock.calls[0][0]).toContain('code=EAUTH');
    expect(loggerErrorSpy.mock.calls[0][0]).toContain('responseCode=535');
    expect(loggerErrorSpy.mock.calls[0][0]).not.toContain('app-password');
  });

  it('sends email using Nodemailer payload', async () => {
    sendMail.mockResolvedValue({ messageId: 'message-id' });
    const provider = createProvider();

    await provider.sendEmail({
      to: 'new.user@example.com',
      subject: 'Redefinição de senha - MatchPredict',
      html: '<p>Reset</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'MatchPredict <matchpredict.app@gmail.com>',
      to: 'new.user@example.com',
      subject: 'Redefinição de senha - MatchPredict',
      html: '<p>Reset</p>',
    });
  });

  it('throws and logs SMTP send errors', async () => {
    const error = Object.assign(new Error('Mailbox unavailable'), {
      code: 'EENVELOPE',
      responseCode: 550,
    });
    sendMail.mockRejectedValue(error);
    const provider = createProvider();

    await expect(
      provider.sendEmail({
        to: 'new.user@example.com',
        subject: 'Redefinição de senha - MatchPredict',
        html: '<p>Reset</p>',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(loggerErrorSpy.mock.calls[0][0]).toContain(
      'Falha ao enviar e-mail via SMTP.',
    );
    expect(loggerErrorSpy.mock.calls[0][0]).toContain('code=EENVELOPE');
    expect(loggerErrorSpy.mock.calls[0][0]).toContain('responseCode=550');
    expect(loggerErrorSpy.mock.calls[0][0]).not.toContain('app-password');
  });
});

function createProvider() {
  return new SmtpEmailProvider({
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        EMAIL_FROM: ' MatchPredict <matchpredict.app@gmail.com> ',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PASSWORD: 'app-password',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_USER: ' matchpredict.app@gmail.com ',
      };

      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService);
}
