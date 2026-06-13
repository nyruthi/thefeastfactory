import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class SelectedPackageItemDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsUUID()
  menuItemId!: string;
}

export class PackageSelectionDto {
  @ApiProperty({ type: [SelectedPackageItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SelectedPackageItemDto)
  selectedItems!: SelectedPackageItemDto[];
}
