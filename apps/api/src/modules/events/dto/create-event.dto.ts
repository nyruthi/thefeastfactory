import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsUUID()
  packageVersionId!: string;

  @ApiProperty()
  @IsUUID()
  addressId!: string;

  @ApiPropertyOptional({ example: "Rahul's Birthday" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventName?: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ example: '18:30' })
  @IsOptional()
  @IsString()
  eventTimeStart?: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  guestCount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialNotes?: string;
}
