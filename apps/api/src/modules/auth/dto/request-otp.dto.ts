import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '9999999999' })
  @IsMobilePhone('en-IN')
  mobileNumber!: string;
}
