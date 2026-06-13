import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@aranyam.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin@12345' })
  @MinLength(8)
  password!: string;
}
