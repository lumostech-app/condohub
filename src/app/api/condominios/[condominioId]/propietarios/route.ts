import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('propietarios')
    .select('*, unidades!inner(codigo, condominio_id)')
    .eq('unidades.condominio_id', params.condominioId)
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ propietarios: data })
}

export async function POST(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  // Verificar que la unidad pertenece al condominio del admin
  const { data: unidad } = await supabase
    .from('unidades')
    .select('id')
    .eq('id', body.unidad_id)
    .eq('condominio_id', params.condominioId)
    .single()

  if (!unidad) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })

  const { data, error } = await supabase
    .from('propietarios')
    .insert({
      admin_id: user.id,
      unidad_id: body.unidad_id,
      nombre: body.nombre,
      cedula: body.cedula ?? null,
      telefono: body.telefono ?? null,
      email: body.email ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ propietario: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('propietarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
