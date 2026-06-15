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

  const { data, error } = await supabase
    .from('cuotas')
    .select('*, unidades(codigo, propietarios(nombre, telefono))')
    .eq('condominio_id', params.condominioId)
    .eq('mes', mes)
    .eq('anio', anio)
    .order('unidades(codigo)', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cuotas: data, mes, anio })
}
