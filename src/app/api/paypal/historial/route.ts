import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('pagos_suscripcion')
    .select('paypal_order_id, plan, monto_usd, paid_until, created_at')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ historial: [] })
  return NextResponse.json({ historial: data })
}
