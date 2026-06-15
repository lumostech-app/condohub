import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal'
import { PLAN_PRECIOS_USD } from '@/types'
import type { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { orderID } = await request.json()
  if (!orderID) return NextResponse.json({ error: 'orderID requerido' }, { status: 400 })

  // Fetch order details to extract plan from reference_id before capturing
  const orderDetails = await getPayPalOrder(orderID)
  const referenceId: string = orderDetails?.purchase_units?.[0]?.reference_id ?? ''
  // reference_id format: "adminId|plan"
  const [adminIdFromOrder, planFromOrder] = referenceId.split('|')

  if (adminIdFromOrder !== user.id) {
    return NextResponse.json({ error: 'Orden no pertenece a este usuario' }, { status: 403 })
  }

  const capture = await capturePayPalOrder(orderID)

  if (capture?.status !== 'COMPLETED') {
    console.error('[PayPal capture]', capture)
    return NextResponse.json({ error: 'Pago no completado' }, { status: 400 })
  }

  const plan = planFromOrder as Plan
  const montoUSD = parseFloat(PLAN_PRECIOS_USD[plan] ?? '0')
  const payerId: string = capture?.payer?.payer_id ?? ''
  const paidUntil = new Date()
  paidUntil.setDate(paidUntil.getDate() + 30)

  // Update admin account
  await supabase
    .from('admins')
    .update({
      plan,
      plan_status: 'active',
      plan_paid_until: paidUntil.toISOString(),
      paypal_payer_id: payerId || null,
    })
    .eq('id', user.id)

  // Record payment in history
  await supabase.from('pagos_suscripcion').insert({
    admin_id: user.id,
    paypal_order_id: orderID,
    plan,
    monto_usd: montoUSD,
    estado: 'completado',
    paid_until: paidUntil.toISOString(),
  })

  return NextResponse.json({ success: true, paidUntil: paidUntil.toISOString(), plan })
}
