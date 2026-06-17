import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AdminRole, Prisma } from '@prisma/client';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { PrismaService } from '../../prisma/prisma.service';

type RegionRow = Prisma.OperatingRegionGetPayload<{}>;

export type RegionAssignment = {
  region: RegionRow;
  distanceKm: Prisma.Decimal;
  billableDistanceKm: number;
  deliveryFee: Prisma.Decimal;
};

@Injectable()
export class OperatingRegionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = false) {
    return this.prisma.operatingRegion.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    }).then((rows) => rows.map((row) => this.serialize(row)));
  }

  async assign(latitude?: Prisma.Decimal | string | null, longitude?: Prisma.Decimal | string | null): Promise<RegionAssignment> {
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      throw new BadRequestException('Choose the exact event location on the map before placing an order.');
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Event location coordinates are invalid.');
    }

    const regions = await this.prisma.operatingRegion.findMany({ where: { isActive: true } });
    const matches = regions
      .map((region) => {
        const distance = haversineKm(lat, lng, Number(region.centerLatitude), Number(region.centerLongitude));
        return { region, distance };
      })
      .filter((entry) => entry.distance <= Number(entry.region.serviceRadiusKm))
      .sort((a, b) => a.distance - b.distance);

    const nearest = matches[0];
    if (!nearest) {
      throw new BadRequestException('This event location is outside our current kitchen service areas.');
    }

    const distanceKm = new Prisma.Decimal(nearest.distance.toFixed(2));
    const billableDistanceKm = Math.ceil(nearest.distance);
    return {
      region: nearest.region,
      distanceKm,
      billableDistanceKm,
      deliveryFee: new Prisma.Decimal(billableDistanceKm).mul(nearest.region.deliveryFeePerKm),
    };
  }

  async resolveAdminScope(admin: JwtPayload, requestedRegionId?: string) {
    if (admin.role === AdminRole.OPERATIONS) {
      const dbAdmin = await this.prisma.adminUser.findUnique({ where: { id: admin.sub }, select: { regionId: true } });
      if (!dbAdmin?.regionId) throw new ForbiddenException('Your operations account is not assigned to a region.');
      return dbAdmin.regionId;
    }
    return requestedRegionId || undefined;
  }

  serialize(region: RegionRow) {
    return {
      ...region,
      centerLatitude: region.centerLatitude.toFixed(8),
      centerLongitude: region.centerLongitude.toFixed(8),
      serviceRadiusKm: region.serviceRadiusKm.toFixed(2),
      deliveryFeePerKm: region.deliveryFeePerKm.toFixed(2),
    };
  }
}

function haversineKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
