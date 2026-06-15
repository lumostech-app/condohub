import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const hoy = new Date()
  const mes = parseInt(searchParams.get('mes') ?? String(hoy.getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(hoy.getFullYear()))
  const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`
  const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pagos')
    .select('*, unidades!inner(codigo, condominio_id, propietarios(nombre))')
    .eq('unidades.condominio_id', params.condominioId)
    .gte('fecha_pago', fechaInicio)
    .lte('fecha_pago', fechaFin)
    .order('fecha_pago', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pagos: data, mes, anio })
}
