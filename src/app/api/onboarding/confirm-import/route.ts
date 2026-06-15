import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ResidenteInput {
  unidad_codigo: string
  nombre: string
  cedula?: string
  telefono?: string
  email?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { condominioId, residentes }: { condominioId: string; residentes: ResidenteInput[] } =
    await request.json()

  // Obtener todas las unidades del condominio
  const { data: unidades } = await supabase
    .from('unidades')
    .select('id, codigo')
    .eq('condominio_id', condominioId)

  const unidadPorCodigo = Object.fromEntries(
    (unidades ?? []).map(u => [u.codigo.toUpperCase(), u.id])
  )

  const importados: string[] = []
  const errores: string[] = []

  for (const r of residentes) {
    const unidadId = unidadPorCodigo[r.unidad_codigo.toUpperCase()]

    if (!unidadId) {
      errores.push(`${r.unidad_codigo} — unidad no encontrada`)
      continue
    }

    if (!r.nombre) {
      errores.push(`${r.unidad_codigo} — falta nombre`)
      continue
    }

    const { error } = await supabase.from('propietarios').insert({
      admin_id: user.id,
      unidad_id: unidadId,
      nombre: r.nombre,
      cedula: r.cedula || null,
      telefono: r.telefono || null,
      email: r.email || null,
    })

    if (error) {
      errores.push(`${r.unidad_codigo} — ${error.message}`)
    } else {
      importados.push(r.unidad_codigo)
    }
  }

  return NextResponse.json({
    importados: importados.length,
    errores,
    success: true,
  })
}
