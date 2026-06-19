import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class OrderSelectedItemDto {
  @ApiProperty() @IsUUID() categoryId!: string;
  @ApiProperty() @IsUUID() menuItemId!: string;
}

export class OrderSelectionDto {
  @ApiProperty() @IsUUID() eventId!: string;
  @ApiProperty({ type: [OrderSelectedItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderSelectedItemDto)
  selectedItems!: OrderSelectedItemDto[];
}
