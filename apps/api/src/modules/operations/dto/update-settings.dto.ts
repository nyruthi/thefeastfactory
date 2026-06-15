import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SettingInput {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  value!: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [SettingInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingInput)
  settings!: SettingInput[];
}
