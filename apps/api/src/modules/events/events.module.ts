import { Module } from '@nestjs/common';
import { OperatingRegionsModule } from '../operating-regions/operating-regions.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({ imports: [OperatingRegionsModule], controllers: [EventsController], providers: [EventsService] })
export class EventsModule {}
