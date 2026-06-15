import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPayPalWebhook } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const webhookId = process.env.PAYPAL_WEBHOOK_ID ?? ''

  if (process.env.NODE_ENV === 'production' && webhookId) {
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => { headers[k] = v })
    const valid = await verifyPayPalWebhook(headers, rawBody, webhookId)
    if (!valid) return new NextResponse('Unauthorized', { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const eventType = event.event_type as string
  const supabase = createAdminClient()

  // CHECKOUT.ORDER.COMPLETED — order approved and captured
  if (eventType === 'CHECKOUT.ORDER.COMPLETED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource as Record<string, unknown>

    // Extract adminId and plan from purchase_units reference_id
    const purchaseUnits = (resource?.purchase_units as Array<Record<string, unknown>>) ?? []
    const referenceId = (purchaseUnits[0]?.reference_id as string) ?? ''
    const [adminId, plan] = referenceId.split('|')

    const orderId = (resource?.id as string) ?? ''

    if (adminId && plan) {
      // Check we haven't already processed this payment
      const { data: existing } = await supabase
        .from('pagos_suscripcion')
        .select('id')
        .eq('paypal_order_id', orderId)
        .single()

      if (!existing) {
        const paidUntil = new Date()
        paidUntil.setDate(paidUntil.getDate() + 30)

        await supabase
          .from('admins')
          .update({
            plan,
            plan_status: 'active',
            plan_paid_until: paidUntil.toISOString(),
          })
          .eq('id', adminId)

        await supabase.from('pagos_suscripcion').insert({
          admin_id: adminId,
          paypal_order_id: orderId,
          plan,
          monto_usd: 0,
          estado: 'completado_webhook',
          paid_until: paidUntil.toISOString(),
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
