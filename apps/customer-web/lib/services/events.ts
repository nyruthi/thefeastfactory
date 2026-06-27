import { EventStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { assignRegion } from './operating-regions'

export interface CreateEventInput {
  packageVersionId: string
  addressId: string
  eventName?: string
  eventDate: string
  eventTimeStart?: string
  guestCount: number
  specialNotes?: string
}

async function validateReferences(userId: string, dto: CreateEventInput) {
  const [address, version, setting] = await Promise.all([
    prisma.userAddress.findFirst({ where: { id: dto.addressId, userId } }),
    prisma.packageVersion.findFirst({
      where: { id: dto.packageVersionId, isActive: true, publishedAt: { not: null }, package: { isActive: true, deletedAt: null } },
    }),
    prisma.platformSetting.findUnique({ where: { key: 'min_booking_lead_hours' } }),
  ])

  if (!address) throw Object.assign(new Error('Address does not belong to customer'), { status: 400 })
  if (!version) throw Object.assign(new Error('Package version is not available'), { status: 400 })
  if (dto.guestCount < version.minGuestCount || (version.maxGuestCount && dto.guestCount > version.maxGuestCount)) {
    throw Object.assign(new Error('Guest count is outside package limits'), { status: 400 })
  }

  const eventDate = new Date(`${dto.eventDate}T00:00:00.000Z`)
  const leadHours = parseInt(setting?.value ?? '48', 10)
  if (eventDate.getTime() - Date.now() < leadHours * 3600 * 1000) {
    throw Object.assign(new Error(`Event requires at least ${leadHours} hours advance booking`), { status: 400 })
  }

  const eventTime = dto.eventTimeStart ? new Date(`1970-01-01T${dto.eventTimeStart}:00.000Z`) : null
  const assignment = await assignRegion(address.latitude, address.longitude)
  return { eventDate, eventTime, ...assignment }
}

const eventInclude = {
  packageVersion: { include: { package: true } },
  address: true,
  region: true,
}

export function listEvents(userId: string) {
  return prisma.event.findMany({
    where: { userId },
    include: eventInclude,
    orderBy: { eventDate: 'desc' },
  })
}

export async function getEvent(userId: string, id: string) {
  const event = await prisma.event.findFirst({
    where: { id, userId },
    include: { ...eventInclude, orders: true },
  })
  if (!event) throw Object.assign(new Error('Event not found'), { status: 404 })
  return event
}

export async function createEvent(userId: string, dto: CreateEventInput) {
  const validated = await validateReferences(userId, dto)
  return prisma.event.create({
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
    include: eventInclude,
  })
}

export async function updateEvent(userId: string, id: string, dto: Partial<CreateEventInput>) {
  const current = await getEvent(userId, id)
  if (current.status !== EventStatus.DRAFT) {
    throw Object.assign(new Error('Only draft events can be updated'), { status: 400 })
  }

  const merged: CreateEventInput = {
    packageVersionId: dto.packageVersionId ?? current.packageVersionId,
    addressId: dto.addressId ?? current.addressId,
    eventName: dto.eventName ?? current.eventName ?? undefined,
    eventDate: dto.eventDate ?? current.eventDate.toISOString().slice(0, 10),
    eventTimeStart: dto.eventTimeStart,
    guestCount: dto.guestCount ?? current.guestCount,
    specialNotes: dto.specialNotes ?? current.specialNotes ?? undefined,
  }

  const validated = await validateReferences(userId, merged)
  return prisma.event.update({
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
    include: eventInclude,
  })
}

export async function deleteEvent(userId: string, id: string) {
  const event = await getEvent(userId, id)
  if (event.orders.length) throw Object.assign(new Error('Events with orders cannot be deleted'), { status: 400 })
  await prisma.event.delete({ where: { id } })
  return { success: true }
}
