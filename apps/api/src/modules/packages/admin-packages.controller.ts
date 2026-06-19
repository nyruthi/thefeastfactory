import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePackageVersionDto } from './dto/create-package-version.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { UpdatePackageVersionDto } from './dto/update-package-version.dto';
import { UpsertCategoryRuleDto } from './dto/upsert-category-rule.dto';
import { UpsertItemPricingDto } from './dto/upsert-item-pricing.dto';
import { UpsertPackageMenuItemDto } from './dto/upsert-package-menu-item.dto';
import { PackagesService } from './packages.service';

@ApiTags('admin-packages')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@Controller('admin')
export class AdminPackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Get('packages')
  listPackages() {
    return this.packages.listAdminPackages();
  }

  @Post('packages')
  createPackage(@Body() dto: CreatePackageDto) {
    return this.packages.createPackage(dto);
  }

  @Patch('packages/:id')
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.updatePackage(id, dto);
  }

  @Post('packages/:id/versions')
  createVersion(@Param('id') id: string, @Body() dto: CreatePackageVersionDto) {
    return this.packages.createVersion(id, dto);
  }

  @Patch('package-versions/:id')
  updateVersion(@Param('id') id: string, @Body() dto: UpdatePackageVersionDto) {
    return this.packages.updateVersion(id, dto);
  }

  @Post('package-versions/:id/category-rules')
  upsertCategoryRule(
    @Param('id') id: string,
    @Body() dto: UpsertCategoryRuleDto,
  ) {
    return this.packages.upsertCategoryRule(id, dto);
  }

  @Post('package-versions/:id/menu-items')
  upsertMenuItem(
    @Param('id') id: string,
    @Body() dto: UpsertPackageMenuItemDto,
  ) {
    return this.packages.upsertMenuItem(id, dto);
  }

  @Post('package-versions/:id/item-pricing')
  upsertItemPricing(
    @Param('id') id: string,
    @Body() dto: UpsertItemPricingDto,
  ) {
    return this.packages.upsertItemPricing(id, dto);
  }
}
