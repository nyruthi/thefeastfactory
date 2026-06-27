import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'

function haversineKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const R = 6371
  const dLat = ((toLat - fromLat) * Math.PI) / 180
  const dLng = ((toLng - fromLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function serializeRegion(region: Prisma.OperatingRegionGetPayload<Record<string, never>>) {
  return {
    ...region,
    centerLatitude: region.centerLatitude.toFixed(8),
    centerLongitude: region.centerLongitude.toFixed(8),
    serviceRadiusKm: region.serviceRadiusKm.toFixed(2),
    deliveryFeePerKm: region.deliveryFeePerKm.toFixed(2),
  }
}

export function listRegions(activeOnly = false) {
  return prisma.operatingRegion
    .findMany({ where: activeOnly ? { isActive: true } : {}, orderBy: { name: 'asc' } })
    .then((rows) => rows.map(serializeRegion))
}

export async function assignRegion(
  latitude?: Prisma.Decimal | string | null,
  longitude?: Prisma.Decimal | string | null,
) {
  if (latitude == null || longitude == null) {
    throw Object.assign(new Error('Choose the exact event location on the map before placing an order.'), { status: 400 })
  }

  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw Object.assign(new Error('Event location coordinates are invalid.'), { status: 400 })
  }

  const regions = await prisma.operatingRegion.findMany({ where: { isActive: true } })
  const matches = regions
    .map((region) => ({ region, distance: haversineKm(lat, lng, Number(region.centerLatitude), Number(region.centerLongitude)) }))
    .filter((e) => e.distance <= Number(e.region.serviceRadiusKm))
    .sort((a, b) => a.distance - b.distance)

  const nearest = matches[0]
  if (!nearest) {
    throw Object.assign(new Error('This event location is outside our current kitchen service areas.'), { status: 400 })
  }

  const distanceKm = new Prisma.Decimal(nearest.distance.toFixed(2))
  const billableDistanceKm = Math.ceil(nearest.distance)
  return {
    region: nearest.region,
    distanceKm,
    billableDistanceKm,
    deliveryFee: new Prisma.Decimal(billableDistanceKm).mul(nearest.region.deliveryFeePerKm),
  }
}

export async function resolveAdminScope(adminId: string, role: string, requestedRegionId?: string) {
  if (role === 'OPERATIONS') {
    const dbAdmin = await prisma.adminUser.findUnique({ where: { id: adminId }, select: { regionId: true } })
    if (!dbAdmin?.regionId) throw Object.assign(new Error('Your operations account is not assigned to a region.'), { status: 403 })
    return dbAdmin.regionId
  }
  return requestedRegionId ?? undefined
}
