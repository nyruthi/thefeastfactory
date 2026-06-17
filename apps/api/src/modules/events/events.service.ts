import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { OperatingRegionsService } from '../operating-regions/operating-regions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regions: OperatingRegionsService,
  ) {}

  list(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      include: { packageVersion: { include: { package: true } }, address: true, region: true },
      orderBy: { eventDate: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, userId },
      include: { packageVersion: { include: { package: true } }, address: true, region: true, orders: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(userId: string, dto: CreateEventDto) {
    const validated = await this.validateReferences(userId, dto);
    return this.prisma.event.create({
      data: {
        userId,
        packageVersionId: dto.packageVersionId,
        addressId: dto.addressId,
        regionId: validated.region.id,
        eventName: dto.eventName,
        eventDate: validated.eventDate,
        eventTimeStart: validated.eventTime,
        guestCount: dto.guestCount,
        distanceKm: validated.distanceKm,
        deliveryFee: validated.deliveryFee,
        specialNotes: dto.specialNotes,
      },
      include: { packageVersion: { include: { package: true } }, address: true, region: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    const current = await this.get(userId, id);
    if (current.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be updated');
    }
    const merged: CreateEventDto = {
      packageVersionId: dto.packageVersionId ?? current.packageVersionId,
      addressId: dto.addressId ?? current.addressId,
      eventName: dto.eventName ?? current.eventName ?? undefined,
      eventDate: dto.eventDate ?? current.eventDate.toISOString().slice(0, 10),
      eventTimeStart: dto.eventTimeStart,
      guestCount: dto.guestCount ?? current.guestCount,
      specialNotes: dto.specialNotes ?? current.specialNotes ?? undefined,
    };
    const validated = await this.validateReferences(userId, merged);
    return this.prisma.event.update({
      where: { id },
      data: {
        packageVersionId: merged.packageVersionId,
        addressId: merged.addressId,
        regionId: validated.region.id,
        eventName: merged.eventName,
        eventDate: validated.eventDate,
        ...(dto.eventTimeStart !== undefined ? { eventTimeStart: validated.eventTime } : {}),
        guestCount: merged.guestCount,
        distanceKm: validated.distanceKm,
        deliveryFee: validated.deliveryFee,
        specialNotes: merged.specialNotes,
      },
      include: { packageVersion: { include: { package: true } }, address: true, region: true },
    });
  }

  async remove(userId: string, id: string) {
    const event = await this.get(userId, id);
    if (event.orders.length) throw new BadRequestException('Events with orders cannot be deleted');
    await this.prisma.event.delete({ where: { id } });
    return { success: true };
  }

  private async validateReferences(userId: string, dto: CreateEventDto) {
    const [address, version, setting] = await Promise.all([
      this.prisma.userAddress.findFirst({ where: { id: dto.addressId, userId } }),
      this.prisma.packageVersion.findFirst({
        where: {
          id: dto.packageVersionId,
          isActive: true,
          publishedAt: { not: null },
          package: { isActive: true, deletedAt: null },
        },
      }),
      this.prisma.platformSetting.findUnique({ where: { key: 'min_booking_lead_hours' } }),
    ]);
    if (!address) throw new BadRequestException('Address does not belong to customer');
    if (!version) throw new BadRequestException('Package version is not available');
    if (dto.guestCount < version.minGuestCount || (version.maxGuestCount && dto.guestCount > version.maxGuestCount)) {
      throw new BadRequestException('Guest count is outside package limits');
    }
    const eventDate = new Date(`${dto.eventDate}T00:00:00.000Z`);
    const leadHours = Number.parseInt(setting?.value ?? '48', 10);
    if (eventDate.getTime() - Date.now() < leadHours * 60 * 60 * 1000) {
      throw new BadRequestException(`Event requires at least ${leadHours} hours advance booking`);
    }
    const eventTime = dto.eventTimeStart ? new Date(`1970-01-01T${dto.eventTimeStart}:00.000Z`) : null;
    const assignment = await this.regions.assign(address.latitude, address.longitude);
    return { eventDate, eventTime, ...assignment };
  }
}
