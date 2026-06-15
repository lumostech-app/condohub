import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('areas_comunes')
    .select('*')
    .eq('condominio_id', params.condominioId)
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ areas: data })
}

export async function POST(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('areas_comunes')
    .insert({
      admin_id: user.id,
      condominio_id: params.condominioId,
      nombre: body.nombre.trim(),
      capacidad: body.capacidad ? Number(body.capacidad) : null,
      hora_apertura: body.hora_apertura || null,
      hora_cierre: body.hora_cierre || null,
      requiere_aprobacion: body.requiere_aprobacion !== false,
      activa: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ area: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, nombre, capacidad, hora_apertura, hora_cierre, requiere_aprobacion, activa } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('areas_comunes')
    .update({ nombre: nombre?.trim(), capacidad: capacidad ? Number(capacidad) : null, hora_apertura: hora_apertura || null, hora_cierre: hora_cierre || null, requiere_aprobacion, activa })
    .eq('id', id)
    .eq('admin_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ area: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('areas_comunes').delete().eq('id', id).eq('admin_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
