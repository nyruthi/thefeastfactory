import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Get() list(@CurrentUser() user: JwtPayload) { return this.events.list(user.sub); }
  @Post() create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEventDto) { return this.events.create(user.sub, dto); }
  @Get(':id') get(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.events.get(user.sub, id); }
  @Patch(':id') update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateEventDto) { return this.events.update(user.sub, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.events.remove(user.sub, id); }
}
