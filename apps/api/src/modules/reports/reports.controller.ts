import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('revenue') revenue() { return this.reports.revenue(); }
  @Get('orders') orders() { return this.reports.orders(); }
  @Get('payments') payments() { return this.reports.payments(); }
}
