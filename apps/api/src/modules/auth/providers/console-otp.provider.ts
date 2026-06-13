import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConsoleOtpProvider {
  private readonly logger = new Logger(ConsoleOtpProvider.name);

  async sendOtp(mobileNumber: string, otp: string): Promise<void> {
    this.logger.log(`Local OTP for ${mobileNumber}: ${otp}`);
  }
}
