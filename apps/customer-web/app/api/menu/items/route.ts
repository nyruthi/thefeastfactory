import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../lib/api-error'
import { listItems } from '../../../../lib/services/menu'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const isVegParam = searchParams.get('isVeg')
    return NextResponse.json(await listItems({
      categoryId: searchParams.get('categoryId') ?? undefined,
      isVeg: isVegParam !== null ? isVegParam === 'true' : undefined,
      search: searchParams.get('search') ?? undefined,
    }))
  } catch (err) {
    return handleError(err)
  }
}
