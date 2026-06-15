import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('inquilinos')
    .select('*, unidades!inner(codigo, condominio_id)')
    .eq('unidades.condominio_id', params.condominioId)
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inquilinos: data })
}

export async function POST(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  if (body.unidad_id) {
    const { data: unidad } = await supabase
      .from('unidades')
      .select('id')
      .eq('id', body.unidad_id)
      .eq('condominio_id', params.condominioId)
      .single()
    if (!unidad) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('inquilinos')
    .insert({
      admin_id: user.id,
      unidad_id: body.unidad_id ?? null,
      nombre: body.nombre,
      cedula: body.cedula ?? null,
      telefono: body.telefono ?? null,
      email: body.email ?? null,
      fecha_inicio: body.fecha_inicio ?? null,
      fecha_fin: body.fecha_fin ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inquilino: data })
}

export async function PATCH(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, nombre, cedula, telefono, email, unidad_id, fecha_inicio, fecha_fin } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  if (unidad_id) {
    const { data: unidad } = await supabase
      .from('unidades')
      .select('id')
      .eq('id', unidad_id)
      .eq('condominio_id', params.condominioId)
      .single()
    if (!unidad) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('inquilinos')
    .update({ nombre: nombre.trim(), cedula: cedula ?? null, telefono: telefono ?? null, email: email ?? null, unidad_id: unidad_id || null, fecha_inicio: fecha_inicio ?? null, fecha_fin: fecha_fin ?? null })
    .eq('id', id)
    .eq('admin_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inquilino: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('inquilinos').delete().eq('id', id).eq('admin_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
