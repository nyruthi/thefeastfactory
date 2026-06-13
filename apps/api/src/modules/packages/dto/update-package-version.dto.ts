import { PartialType } from '@nestjs/swagger';
import { CreatePackageVersionDto } from './create-package-version.dto';

export class UpdatePackageVersionDto extends PartialType(CreatePackageVersionDto) {}
