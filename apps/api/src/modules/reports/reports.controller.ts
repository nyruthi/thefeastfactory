import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('revenue') revenue(@CurrentAdmin() admin: JwtPayload, @Query('regionId') regionId?: string) { return this.reports.revenue(admin, regionId); }
  @Get('orders') orders(@CurrentAdmin() admin: JwtPayload, @Query('regionId') regionId?: string) { return this.reports.orders(admin, regionId); }
  @Get('payments') payments(@CurrentAdmin() admin: JwtPayload, @Query('regionId') regionId?: string) { return this.reports.payments(admin, regionId); }
}
