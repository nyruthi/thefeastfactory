import { DocumentType, PaymentStatus, Prisma, RefundStatus } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { JwtPayload } from '../auth'
import { prisma } from '../prisma'
import { resolveAdminScope } from './operating-regions'

const EDITABLE_SETTINGS = new Set([
  'min_booking_lead_hours', 'otp_expiry_seconds', 'otp_max_attempts', 'razorpay_currency',
  'business_legal_name', 'business_trade_name', 'business_address', 'business_gstin',
  'business_state_code', 'business_pan', 'business_support_email', 'business_support_phone',
  'business_logo_url', 'invoice_prefix', 'receipt_prefix', 'credit_note_prefix',
  'tax_cgst_rate', 'tax_sgst_rate', 'tax_igst_rate', 'tax_sac_code', 'invoice_legal_footer',
])

// ── Notifications ──────────────────────────────────────────────────────────────

export function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 })
}

export async function unreadCount(userId: string) {
  return { count: await prisma.notification.count({ where: { userId, readAt: null } }) }
}

export async function markNotificationRead(userId: string, id: string) {
  const result = await prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } })
  if (!result.count) throw Object.assign(new Error('Notification not found'), { status: 404 })
  return { success: true }
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
  return { success: true }
}

// ── Documents ──────────────────────────────────────────────────────────────────

async function loadDocumentOrder(orderId: string, userId: string, admin: boolean) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(admin ? {} : { userId }) },
    include: { user: true, event: { include: { address: true } }, selectedItems: true, payments: { include: { refunds: true } } },
  })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
  return order
}

async function getSettings() {
  const rows = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

function taxSettingsComplete(settings: Record<string, string>) {
  return Boolean(settings.business_legal_name && settings.business_address && settings.business_gstin && settings.business_state_code)
}

function buildSnapshot(order: Awaited<ReturnType<typeof loadDocumentOrder>>, settings: Record<string, string>) {
  return {
    business: {
      legalName: settings.business_legal_name || 'The Feast Factory',
      tradeName: settings.business_trade_name || 'The Feast Factory',
      address: settings.business_address || '',
      gstin: settings.business_gstin || '',
      stateCode: settings.business_state_code || '',
      supportEmail: settings.business_support_email || '',
      supportPhone: settings.business_support_phone || '',
      sacCode: settings.tax_sac_code || '',
      legalFooter: settings.invoice_legal_footer || '',
    },
    order: {
      orderNumber: order.orderNumber,
      packageName: order.packageName,
      guestCount: order.guestCount,
      finalPerPlatePrice: order.finalPerPlatePrice.toFixed(2),
      totalAmount: order.totalAmount.toFixed(2),
      createdAt: order.createdAt,
      eventDate: order.event.eventDate,
      address: order.event.address,
      customer: { name: order.user.name, mobileNumber: order.user.mobileNumber, email: order.user.email },
      items: order.selectedItems.map((item) => ({ name: item.menuItemName, category: item.categoryName, adjustmentAmount: item.adjustmentAmount.toFixed(2) })),
    },
    tax: { cgstRate: settings.tax_cgst_rate || '0', sgstRate: settings.tax_sgst_rate || '0', igstRate: settings.tax_igst_rate || '0' },
  }
}

async function ensureDocument(orderId: string, userId: string, paymentId: string, refundId: string | undefined, documentType: DocumentType, snapshot: Prisma.InputJsonValue, prefix: string) {
  const exists = await prisma.orderDocument.findFirst({ where: { orderId, documentType, refundId: refundId ?? null } })
  if (exists) return exists
  const number = `${prefix}-${new Date().getFullYear()}-${orderId.slice(0, 8).toUpperCase()}${refundId ? `-${refundId.slice(0, 4).toUpperCase()}` : ''}`
  return prisma.orderDocument.create({ data: { orderId, userId, paymentId, refundId, documentType, documentNumber: number, snapshot } })
}

async function ensureDocuments(order: Awaited<ReturnType<typeof loadDocumentOrder>>) {
  const paid = order.payments.find((p) => p.paymentStatus === PaymentStatus.PAID || p.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED || p.paymentStatus === PaymentStatus.REFUNDED)
  if (!paid) return
  const settings = await getSettings()
  const snapshot = buildSnapshot(order, settings)
  await ensureDocument(order.id, order.userId, paid.id, undefined, DocumentType.PAYMENT_RECEIPT, snapshot, settings.receipt_prefix || 'RCT')
  if (taxSettingsComplete(settings)) await ensureDocument(order.id, order.userId, paid.id, undefined, DocumentType.GST_INVOICE, snapshot, settings.invoice_prefix || 'INV')
  for (const refund of paid.refunds.filter((r) => r.refundStatus === RefundStatus.SUCCESS)) {
    await ensureDocument(order.id, order.userId, paid.id, refund.id, DocumentType.REFUND_CREDIT_NOTE, { ...snapshot, refund: { amount: refund.amount.toFixed(2), reason: refund.reason, processedAt: refund.processedAt } }, settings.credit_note_prefix || 'CRN')
  }
}

function renderPdf(type: DocumentType, number: string, snapshot: Prisma.JsonValue) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 48, size: 'A4' })
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    const data = snapshot as Record<string, unknown> & { business: Record<string, string>; order: Record<string, unknown>; tax?: Record<string, string>; refund?: { amount: string } }
    doc.fontSize(20).text(data.business.tradeName || data.business.legalName)
    doc.fontSize(10).fillColor('#555').text(data.business.address || '')
    doc.moveDown().fillColor('#111').fontSize(16).text(type.replaceAll('_', ' '))
    doc.fontSize(10).text(`Document: ${number}`)
    const order = data.order as { orderNumber: string; customer: { name?: string; mobileNumber: string }; eventDate: string; packageName: string; guestCount: number; totalAmount: string }
    doc.text(`Order: ${order.orderNumber}`)
    doc.text(`Customer: ${order.customer.name || order.customer.mobileNumber}`)
    doc.text(`Event date: ${new Date(order.eventDate).toLocaleDateString('en-IN')}`)
    doc.moveDown().fontSize(12).text(`${order.packageName} for ${order.guestCount} guests`)
    doc.text(`Total paid: INR ${order.totalAmount}`)
    if (data.refund) doc.text(`Refund: INR ${data.refund.amount}`)
    if (type === DocumentType.GST_INVOICE) {
      doc.moveDown().fontSize(10).text(`GSTIN: ${data.business.gstin}`)
      doc.text(`SAC: ${data.business.sacCode}`)
      doc.text(`CGST: ${data.tax?.cgstRate}%  SGST: ${data.tax?.sgstRate}%  IGST: ${data.tax?.igstRate}%`)
    }
    doc.moveDown().fillColor('#555').text(data.business.legalFooter || 'Computer-generated document.')
    doc.end()
  })
}

export async function listDocuments(userId: string, orderId: string, admin = false) {
  const order = await loadDocumentOrder(orderId, userId, admin)
  await ensureDocuments(order)
  return prisma.orderDocument.findMany({
    where: { orderId },
    select: { id: true, documentType: true, documentNumber: true, generatedAt: true },
    orderBy: { generatedAt: 'desc' },
  })
}

export async function getDocumentPdf(userId: string, orderId: string, documentId: string, admin = false) {
  await loadDocumentOrder(orderId, userId, admin)
  const document = await prisma.orderDocument.findFirst({ where: { id: documentId, orderId } })
  if (!document) throw Object.assign(new Error('Document not found'), { status: 404 })
  return { filename: `${document.documentNumber}.pdf`, buffer: await renderPdf(document.documentType, document.documentNumber, document.snapshot) }
}

// ── Admin: notes ───────────────────────────────────────────────────────────────

async function assertOrderExists(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
}

export async function listOrderNotes(orderId: string) {
  await assertOrderExists(orderId)
  return prisma.orderNote.findMany({ where: { orderId }, include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } })
}

export async function addOrderNote(adminId: string, orderId: string, body: string) {
  await assertOrderExists(orderId)
  return prisma.orderNote.create({ data: { orderId, authorId: adminId, body: body.trim() }, include: { author: { select: { id: true, name: true, role: true } } } })
}

// ── Admin: calendar & queue ────────────────────────────────────────────────────

export async function getCalendar(admin: JwtPayload, from?: string, to?: string, requestedRegionId?: string, city?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '', requestedRegionId)
  const start = from ? new Date(from) : new Date()
  const end = to ? new Date(to) : new Date(start.getTime() + 30 * 86_400_000)
  return prisma.event.findMany({
    where: {
      eventDate: { gte: start, lte: end },
      ...(regionId ? { regionId } : {}),
      ...(city ? { address: { city: { contains: city, mode: 'insensitive' } } } : {}),
    },
    include: {
      address: true, region: true,
      user: { select: { id: true, name: true, mobileNumber: true } },
      orders: { select: { id: true, orderNumber: true, orderStatus: true, paymentStatus: true } },
    },
    orderBy: [{ eventDate: 'asc' }, { eventTimeStart: 'asc' }],
  })
}

export async function getQueue(admin: JwtPayload, requestedRegionId?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '', requestedRegionId)
  const now = new Date()
  const upcoming = new Date(now.getTime() + 7 * 86_400_000)
  const [upcomingEvents, failedPayments, pendingRefunds] = await Promise.all([
    prisma.event.findMany({ where: { eventDate: { gte: now, lte: upcoming }, status: { not: 'CANCELLED' }, ...(regionId ? { regionId } : {}) }, include: { address: true, region: true, orders: true, user: true }, orderBy: { eventDate: 'asc' }, take: 30 }),
    prisma.payment.findMany({ where: { paymentStatus: PaymentStatus.FAILED, ...(regionId ? { order: { regionId } } : {}) }, include: { order: { include: { user: true, region: true } } }, orderBy: { updatedAt: 'desc' }, take: 20 }),
    prisma.refund.findMany({ where: { refundStatus: { in: [RefundStatus.INITIATED, RefundStatus.PROCESSING] }, ...(regionId ? { payment: { order: { regionId } } } : {}) }, include: { payment: { include: { order: { include: { region: true } } } } }, orderBy: { initiatedAt: 'asc' }, take: 20 }),
  ])
  return { upcomingEvents, failedPayments, pendingRefunds }
}

// ── Admin: settings ────────────────────────────────────────────────────────────

export function listSettings() {
  return prisma.platformSetting.findMany({ orderBy: { key: 'asc' } })
}

export async function updateSettings(settings: { key: string; value: string }[]) {
  const invalid = settings.find((s) => !EDITABLE_SETTINGS.has(s.key))
  if (invalid) throw Object.assign(new Error(`Setting ${invalid.key} cannot be edited`), { status: 400 })
  await prisma.$transaction(settings.map((s) => prisma.platformSetting.upsert({ where: { key: s.key }, create: { key: s.key, value: s.value }, update: { value: s.value } })))
  return listSettings()
}

export function readiness() {
  return {
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET),
    msg91: Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID),
    googleCloudStorage: Boolean(process.env.GCP_PROJECT_ID && process.env.GCP_STORAGE_BUCKET),
    googleMaps: 'configured-client-side',
    resend: 'deferred',
    sentry: 'deferred',
  }
}
