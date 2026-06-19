import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConsoleOtpProvider {
  private readonly logger = new Logger(ConsoleOtpProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(mobileNumber: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');

    if (authKey && templateId) {
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.set('template_id', templateId);
      url.searchParams.set('mobile', `91${mobileNumber}`);
      url.searchParams.set('authkey', authKey);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const result = (await response.json().catch(() => undefined)) as
        | { type?: string; message?: string }
        | undefined;

      if (!response.ok || result?.type === 'error') {
        this.logger.error(
          `MSG91 OTP delivery failed: ${result?.message ?? response.statusText}`,
        );
        throw new BadGatewayException(
          'OTP delivery is temporarily unavailable',
        );
      }
      return;
    }

    this.logger.log(`Local OTP for ${mobileNumber}: ${otp}`);
  }
}
