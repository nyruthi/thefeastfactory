import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpsertCategoryRuleDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  maxSelections!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
