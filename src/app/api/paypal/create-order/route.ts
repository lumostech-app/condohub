import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalOrder } from '@/lib/paypal'
import { PLAN_PRECIOS_USD } from '@/types'
import type { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { plan } = await request.json()

  const amount = PLAN_PRECIOS_USD[plan as Plan]
  if (!amount) return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })

  const order = await createPayPalOrder(amount, plan, user.id)

  if (!order?.id) {
    console.error('[PayPal create-order]', order)
    return NextResponse.json({ error: 'Error al crear la orden en PayPal' }, { status: 500 })
  }

  return NextResponse.json({ orderID: order.id })
}
