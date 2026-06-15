import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('unidades')
    .select('*, propietarios(id, nombre, telefono), edificios(nombre)')
    .eq('condominio_id', params.condominioId)
    .order('codigo', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ unidades: data })
}

export async function POST(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('unidades')
    .insert({
      condominio_id: params.condominioId,
      admin_id: user.id,
      codigo: body.codigo,
      tipo: body.tipo ?? 'apartamento',
      piso: body.piso ?? null,
      parqueos: body.parqueos ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ unidad: data })
}

export async function DELETE(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase
    .from('unidades')
    .delete()
    .eq('id', id)
    .eq('condominio_id', params.condominioId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
