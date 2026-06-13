import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class UpsertItemPricingDto {
  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: '100.00' })
  @Matches(/^\d+(\.\d{1,2})?$/)
  itemPrice!: string;

  @ApiProperty({ example: '80.00' })
  @Matches(/^\d+(\.\d{1,2})?$/)
  includedValue!: string;
}
