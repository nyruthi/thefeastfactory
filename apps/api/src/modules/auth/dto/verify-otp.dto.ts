import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '9999999999' })
  @IsMobilePhone('en-IN')
  mobileNumber!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{4,6}$/)
  otp!: string;
}
