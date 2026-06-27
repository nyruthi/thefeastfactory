import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AttachCartEventDto {
  @ApiProperty()
  @IsUUID()
  eventId!: string;
}
