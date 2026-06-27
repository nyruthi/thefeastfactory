import { jwtVerify, SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

export type JwtSubjectType = 'customer' | 'admin'

export type JwtPayload = {
  sub: string
  type: JwtSubjectType
  role?: 'ADMIN' | 'OPERATIONS'
  regionId?: string | null
}

function accessSecret() {
  const s = process.env.JWT_ACCESS_SECRET
  if (!s) throw new Error('JWT_ACCESS_SECRET not set')
  return new TextEncoder().encode(s)
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET
  if (!s) throw new Error('JWT_REFRESH_SECRET not set')
  return new TextEncoder().encode(s)
}

export async function signTokens(payload: JwtPayload) {
  const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d'

  const claims: Record<string, unknown> = { type: payload.type }
  if (payload.role) claims.role = payload.role
  if (payload.regionId !== undefined) claims.regionId = payload.regionId

  const [accessToken, refreshToken] = await Promise.all([
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setExpirationTime(accessExpiresIn)
      .sign(accessSecret()),
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setExpirationTime(refreshExpiresIn)
      .sign(refreshSecret()),
  ])

  return { accessToken, refreshToken }
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret())
  return {
    sub: payload.sub as string,
    type: payload.type as JwtSubjectType,
    role: payload.role as 'ADMIN' | 'OPERATIONS' | undefined,
    regionId: payload.regionId as string | null | undefined,
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecret())
  return {
    sub: payload.sub as string,
    type: payload.type as JwtSubjectType,
    role: payload.role as 'ADMIN' | 'OPERATIONS' | undefined,
    regionId: payload.regionId as string | null | undefined,
  }
}

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function requireCustomer(req: NextRequest) {
  const token = extractBearer(req)
  if (!token) return { error: unauth('Missing token'), payload: null }
  try {
    const payload = await verifyAccessToken(token)
    if (payload.type !== 'customer') return { error: unauth('Invalid token type'), payload: null }
    return { error: null, payload }
  } catch {
    return { error: unauth('Invalid or expired token'), payload: null }
  }
}

export async function requireAdmin(req: NextRequest, requiredRole?: 'ADMIN' | 'OPERATIONS') {
  const token = extractBearer(req)
  if (!token) return { error: unauth('Missing token'), payload: null }
  try {
    const payload = await verifyAccessToken(token)
    if (payload.type !== 'admin') return { error: unauth('Invalid token type'), payload: null }
    if (requiredRole && payload.role !== requiredRole) {
      return { error: forbidden('Insufficient permissions'), payload: null }
    }
    return { error: null, payload }
  } catch {
    return { error: unauth('Invalid or expired token'), payload: null }
  }
}

function unauth(message: string) {
  return NextResponse.json({ error: message }, { status: 401 })
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}
