import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: AddressType, default: AddressType.HOME })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType = AddressType.HOME;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'Flat 101, Green Residency' })
  @IsString()
  @MaxLength(255)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Near Central Park' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ example: 'Hyderabad' })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Telangana' })
  @IsString()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '500081' })
  @Matches(/^\d{6}$/)
  pincode!: string;

  @ApiPropertyOptional({ example: 'Opposite metro station' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @ApiPropertyOptional({ example: '17.44858350' })
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiPropertyOptional({ example: '78.39080340' })
  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
