import { Inject, Injectable } from '@nestjs/common';

import {
  EMAIL_PROVIDER,
  EmailProvider,
} from './providers/email-provider.interface';

type SendPasswordResetEmailParams = {
  email: string;
  name: string;
  resetUrl: string;
};

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  async sendPasswordResetEmail({
    email,
    name,
    resetUrl,
  }: SendPasswordResetEmailParams) {
    await this.emailProvider.sendEmail({
      to: this.normalizeEmail(email),
      subject: 'Redefinição de senha - MatchPredict',
      html: this.createPasswordResetTemplate(name, resetUrl),
    });
  }

  private createPasswordResetTemplate(name: string, resetUrl: string) {
    return `
      <div style="margin: 0; padding: 24px; background: #f8fafc; font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="padding: 24px; background: #111827; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; line-height: 1.3;">Redefinição de senha</h1>
            <p style="margin: 8px 0 0; color: #d1d5db;">MatchPredict</p>
          </div>
          <div style="padding: 24px;">
            <p>Olá, ${this.escapeHtml(name)}.</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p style="margin: 24px 0;">
              <a href="${this.escapeHtml(resetUrl)}" style="display: inline-block; padding: 13px 20px; background: #22c55e; color: #052e16; text-decoration: none; border-radius: 8px; font-weight: 700;">
                Redefinir senha
              </a>
            </p>
            <p>Este link expira em 30 minutos.</p>
            <p>Caso você não tenha solicitado, ignore este e-mail.</p>
          </div>
          <div style="padding: 16px 24px; background: #f1f5f9; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">MatchPredict - Palpites esportivos com ranking competitivo.</p>
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
