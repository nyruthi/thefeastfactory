import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SelectedItemRole } from '@prisma/client';

export class CartSelectionItemDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  replacedMenuItemId?: string | null;

  @ApiProperty({ enum: SelectedItemRole })
  @IsEnum(SelectedItemRole)
  role!: SelectedItemRole;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class ReplaceCartItemsDto {
  @ApiProperty({ type: [CartSelectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartSelectionItemDto)
  items!: CartSelectionItemDto[];
}
