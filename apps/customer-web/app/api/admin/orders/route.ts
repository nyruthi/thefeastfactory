import { OrderStatus, PaymentStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../lib/api-error'
import { requireAdmin } from '../../../../lib/auth'
import { listAdminOrders } from '../../../../lib/services/admin-orders'

export async function GET(req: NextRequest) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { searchParams } = req.nextUrl
    return NextResponse.json(await listAdminOrders(payload!, {
      regionId: searchParams.get('regionId') ?? undefined,
      orderStatus: (searchParams.get('orderStatus') as OrderStatus) ?? undefined,
      paymentStatus: (searchParams.get('paymentStatus') as PaymentStatus) ?? undefined,
      mobileNumber: searchParams.get('mobileNumber') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      city: searchParams.get('city') ?? undefined,
    }))
  } catch (err) {
    return handleError(err)
  }
}
