export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export type SendEmailParams = {
  html: string;
  subject: string;
  to: string;
};

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<void>;
}
