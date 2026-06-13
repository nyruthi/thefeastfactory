import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PackageSelectionDto } from './dto/package-selection.dto';
import { PackagesService } from './packages.service';

@ApiTags('packages')
@Controller()
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Get('packages')
  listPackages() {
    return this.packages.listPackages();
  }

  @Get('packages/:id/active-version')
  getActiveVersion(@Param('id') id: string) {
    return this.packages.getActiveVersion(id);
  }

  @Get('package-versions/:id/configuration')
  getConfiguration(@Param('id') id: string) {
    return this.packages.getConfiguration(id);
  }

  @Post('package-versions/:id/validate-selection')
  validateSelection(@Param('id') id: string, @Body() dto: PackageSelectionDto) {
    return this.packages.validateSelection(id, dto);
  }

  @Post('package-versions/:id/price-selection')
  priceSelection(@Param('id') id: string, @Body() dto: PackageSelectionDto) {
    return this.packages.priceSelection(id, dto);
  }
}
