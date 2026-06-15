import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { cuota_id, unidad_id, monto, fecha_pago, metodo, banco, referencia, comprobante_url } = body

  if (!cuota_id || !unidad_id || !monto) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { error: pagoError } = await supabase.from('pagos').insert({
    admin_id: user.id,
    cuota_id,
    unidad_id,
    monto: Number(monto),
    fecha_pago: fecha_pago ?? new Date().toISOString().split('T')[0],
    metodo: metodo ?? 'transferencia',
    banco: banco ?? null,
    referencia: referencia ?? null,
    comprobante_url: comprobante_url ?? null,
    registrado_por: 'admin',
  })

  if (pagoError) return NextResponse.json({ error: pagoError.message }, { status: 500 })

  const { error: cuotaError } = await supabase
    .from('cuotas')
    .update({ estado: 'pagado', updated_at: new Date().toISOString() })
    .eq('id', cuota_id)

  if (cuotaError) return NextResponse.json({ error: cuotaError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
