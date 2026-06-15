import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const condominioId = searchParams.get('condominioId')
  if (!condominioId) return NextResponse.json({ error: 'condominioId requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('config_cuotas')
    .select('*')
    .eq('condominio_id', condominioId)
    .single()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data ?? null })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { condominioId, monto_base, dias_gracia, porcentaje_mora, dia_cobro } =
    await request.json()

  if (!condominioId || !monto_base) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
  }

  const { error } = await supabase.from('config_cuotas').upsert(
    {
      condominio_id: condominioId,
      admin_id: user.id,
      monto_base: Number(monto_base),
      dias_gracia: Number(dias_gracia ?? 5),
      porcentaje_mora: Number(porcentaje_mora ?? 5),
      bloqueo_reservas: true,
      dia_cobro: Number(dia_cobro ?? 1),
    },
    { onConflict: 'condominio_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
