export interface EmailProvider {
  sendEmail(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
  }>;
}
