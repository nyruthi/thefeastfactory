import bcrypt from 'bcrypt'
import { signTokens, verifyRefreshToken } from '../auth'
import { prisma } from '../prisma'

async function getIntSetting(key: string, fallback: number): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({ where: { key } })
  return setting ? parseInt(setting.value, 10) : fallback
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendOtp(mobileNumber: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY
  const templateId = process.env.MSG91_TEMPLATE_ID

  if (authKey && templateId) {
    const url = new URL('https://control.msg91.com/api/v5/otp')
    url.searchParams.set('template_id', templateId)
    url.searchParams.set('mobile', `91${mobileNumber}`)
    url.searchParams.set('authkey', authKey)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    })
    const result = await response.json().catch(() => undefined) as { type?: string; message?: string } | undefined

    if (!response.ok || result?.type === 'error') {
      throw new Error('OTP delivery is temporarily unavailable')
    }
    return
  }

  console.log(`[OTP] ${mobileNumber}: ${otp}`)
}

export async function requestCustomerOtp(mobileNumber: string) {
  const otp = generateOtp()
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10)
  const otpHash = await bcrypt.hash(otp, saltRounds)
  const expirySeconds = parseInt(process.env.MSG91_OTP_EXPIRY_SECONDS ?? '300', 10)

  await prisma.otpVerification.create({
    data: {
      mobileNumber,
      otpHash,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    },
  })

  await sendOtp(mobileNumber, otp)

  return { success: true, expiresInSeconds: expirySeconds, message: 'OTP sent' }
}

export async function verifyCustomerOtp(mobileNumber: string, otp: string) {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: { mobileNumber, isVerified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) throw Object.assign(new Error('Invalid or expired OTP'), { status: 401 })

  const maxAttempts = await getIntSetting('otp_max_attempts', 5)
  if (otpRecord.attempts >= maxAttempts) {
    throw Object.assign(new Error('Maximum OTP attempts exceeded'), { status: 401 })
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otpHash)
  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    })
    throw Object.assign(new Error('Invalid or expired OTP'), { status: 401 })
  }

  const user = await prisma.user.upsert({
    where: { mobileNumber },
    update: { isActive: true },
    create: { mobileNumber },
  })

  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isVerified: true },
  })

  const tokens = await signTokens({ sub: user.id, type: 'customer' })
  return {
    ...tokens,
    user: { id: user.id, mobileNumber: user.mobileNumber, name: user.name, email: user.email },
  }
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
    include: { region: true },
  })

  if (!admin?.isActive) throw Object.assign(new Error('Invalid admin credentials'), { status: 401 })

  const isValid = await bcrypt.compare(password, admin.passwordHash)
  if (!isValid) throw Object.assign(new Error('Invalid admin credentials'), { status: 401 })

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })

  const tokens = await signTokens({ sub: admin.id, type: 'admin', role: admin.role, regionId: admin.regionId })
  return {
    ...tokens,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      regionId: admin.regionId,
      region: admin.region ? serializeRegion(admin.region) : null,
    },
  }
}

export async function refreshSession(refreshToken: string, expectedType: 'customer' | 'admin') {
  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 })
  }

  if (payload.type !== expectedType) throw Object.assign(new Error('Invalid refresh token'), { status: 401 })

  if (payload.type === 'customer') {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user?.isActive) throw Object.assign(new Error('Invalid refresh token'), { status: 401 })
    const tokens = await signTokens({ sub: user.id, type: 'customer' })
    return { ...tokens, user: { id: user.id, mobileNumber: user.mobileNumber, name: user.name, email: user.email } }
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub }, include: { region: true } })
  if (!admin?.isActive) throw Object.assign(new Error('Invalid refresh token'), { status: 401 })

  const tokens = await signTokens({ sub: admin.id, type: 'admin', role: admin.role, regionId: admin.regionId })
  return {
    ...tokens,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      regionId: admin.regionId,
      region: admin.region ? serializeRegion(admin.region) : null,
    },
  }
}

function serializeRegion(region: { centerLatitude: { toFixed: (n: number) => string }; centerLongitude: { toFixed: (n: number) => string }; serviceRadiusKm: { toFixed: (n: number) => string }; deliveryFeePerKm: { toFixed: (n: number) => string }; [key: string]: unknown }) {
  return {
    ...region,
    centerLatitude: region.centerLatitude.toFixed(8),
    centerLongitude: region.centerLongitude.toFixed(8),
    serviceRadiusKm: region.serviceRadiusKm.toFixed(2),
    deliveryFeePerKm: region.deliveryFeePerKm.toFixed(2),
  }
}
