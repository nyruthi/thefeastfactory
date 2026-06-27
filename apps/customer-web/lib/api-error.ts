import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: err.errors.map((e) => e.message).join(', ') },
      { status: 400 },
    )
  }

  const appError = err as { status?: number; message?: string }
  const status = appError?.status ?? 500
  const message = appError?.message ?? 'Internal server error'

  return NextResponse.json({ error: message }, { status })
}
