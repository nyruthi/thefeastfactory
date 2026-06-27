import { AddressType, Prisma } from '@prisma/client'
import { prisma } from '../prisma'

export async function getProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    select: { id: true, mobileNumber: true, name: true, email: true },
  })
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
  return user
}

export async function updateProfile(userId: string, data: { name?: string; email?: string }) {
  await getProfile(userId)
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
    },
    select: { id: true, mobileNumber: true, name: true, email: true },
  })
}

function serializeAddress(addr: { latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null; [key: string]: unknown }) {
  return {
    ...addr,
    latitude: addr.latitude?.toString() ?? null,
    longitude: addr.longitude?.toString() ?? null,
  }
}

export async function listAddresses(userId: string) {
  await getProfile(userId)
  const addresses = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
  return addresses.map(serializeAddress)
}

export interface CreateAddressInput {
  addressType?: AddressType
  label?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  landmark?: string
  latitude?: number
  longitude?: number
  isDefault?: boolean
}

export async function createAddress(userId: string, dto: CreateAddressInput) {
  await getProfile(userId)

  return prisma.$transaction(async (tx) => {
    const shouldSetDefault =
      dto.isDefault ?? (await tx.userAddress.count({ where: { userId } })) === 0

    if (shouldSetDefault) {
      await tx.userAddress.updateMany({ where: { userId }, data: { isDefault: false } })
    }

    const address = await tx.userAddress.create({
      data: {
        userId,
        addressType: dto.addressType ?? 'HOME',
        label: dto.label,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        landmark: dto.landmark,
        latitude: dto.latitude ? new Prisma.Decimal(dto.latitude) : undefined,
        longitude: dto.longitude ? new Prisma.Decimal(dto.longitude) : undefined,
        isDefault: shouldSetDefault,
      },
    })

    return serializeAddress(address)
  })
}

export interface UpdateAddressInput {
  addressType?: AddressType
  label?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  landmark?: string
  latitude?: number | null
  longitude?: number | null
  isDefault?: boolean
}

export async function updateAddress(userId: string, addressId: string, dto: UpdateAddressInput) {
  const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } })
  if (!existing) throw Object.assign(new Error('Address not found'), { status: 404 })

  return prisma.$transaction(async (tx) => {
    if (dto.isDefault) {
      await tx.userAddress.updateMany({ where: { userId }, data: { isDefault: false } })
    }

    const address = await tx.userAddress.update({
      where: { id: addressId },
      data: {
        ...(dto.addressType !== undefined ? { addressType: dto.addressType } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.addressLine1 !== undefined ? { addressLine1: dto.addressLine1 } : {}),
        ...(dto.addressLine2 !== undefined ? { addressLine2: dto.addressLine2 } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
        ...(dto.landmark !== undefined ? { landmark: dto.landmark } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude != null ? new Prisma.Decimal(dto.latitude) : null } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude != null ? new Prisma.Decimal(dto.longitude) : null } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    })

    return serializeAddress(address)
  })
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } })
  if (!address) throw Object.assign(new Error('Address not found'), { status: 404 })

  await prisma.userAddress.delete({ where: { id: address.id } })

  if (address.isDefault) {
    const next = await prisma.userAddress.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    if (next) await prisma.userAddress.update({ where: { id: next.id }, data: { isDefault: true } })
  }

  return { success: true }
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } })
  if (!address) throw Object.assign(new Error('Address not found'), { status: 404 })

  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: addressId }, data: { isDefault: true } }),
  ])

  return { success: true }
}
