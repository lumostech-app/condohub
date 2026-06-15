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
    .from('gastos')
    .select('*')
    .eq('condominio_id', params.condominioId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gastos: data, mes, anio })
}

export async function POST(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('gastos')
    .insert({
      admin_id: user.id,
      condominio_id: params.condominioId,
      categoria: body.categoria ?? 'otro',
      descripcion: body.descripcion,
      monto: Number(body.monto),
      fecha: body.fecha ?? new Date().toISOString().split('T')[0],
      proveedor_nombre: body.proveedor_nombre ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gasto: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('gastos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
