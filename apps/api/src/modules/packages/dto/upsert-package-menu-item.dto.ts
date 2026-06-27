import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageMenuItemRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class UpsertPackageMenuItemDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

  @ApiPropertyOptional({
    enum: PackageMenuItemRole,
    default: PackageMenuItemRole.INCLUDED,
  })
  @IsOptional()
  @IsEnum(PackageMenuItemRole)
  role?: PackageMenuItemRole;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSwappable?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
