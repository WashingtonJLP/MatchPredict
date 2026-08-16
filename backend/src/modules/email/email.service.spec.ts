import { EmailProvider } from './providers/email-provider.interface';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let emailProvider: { sendEmail: jest.Mock };
  let service: EmailService;

  beforeEach(() => {
    emailProvider = {
      sendEmail: jest.fn(),
    };
    service = new EmailService(emailProvider as unknown as EmailProvider);
  });

  it('delegates password reset email to configured provider', async () => {
    await service.sendPasswordResetEmail({
      email: ' New.User@Example.COM ',
      name: 'New User',
      resetUrl: 'https://app.example.com/reset-password?token=abc',
    });

    expect(emailProvider.sendEmail).toHaveBeenCalledWith({
      to: 'new.user@example.com',
      subject: 'Redefinição de senha - MatchPredict',
      html: expect.stringContaining('Redefinir senha'),
    });
    expect(emailProvider.sendEmail.mock.calls[0][0].html).toContain(
      'Este link expira em 30 minutos.',
    );
    expect(emailProvider.sendEmail.mock.calls[0][0].html).toContain(
      'https://app.example.com/reset-password?token=abc',
    );
  });
});
