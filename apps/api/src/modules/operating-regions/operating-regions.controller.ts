import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { OperatingRegionsService } from './operating-regions.service';

@ApiTags('operating-regions')
@Controller()
export class OperatingRegionsController {
  constructor(private readonly regions: OperatingRegionsService) {}

  @Get('admin/operating-regions')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  list(@Query('activeOnly') activeOnly?: string) {
    return this.regions.list(activeOnly === 'true');
  }
}
