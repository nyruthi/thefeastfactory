import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateCartDto {
  @ApiProperty()
  @IsUUID()
  packageVersionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  eventId?: string | null;
}
