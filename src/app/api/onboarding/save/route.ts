import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_LIMITES } from '@/types'

interface EdificioInput {
  nombre: string
  niveles: number
  tiene_sotano: boolean
  unidades: string[]
}

interface EstructuraInput {
  nombre: string
  direccion: string
  tipo: 'residencial_multi' | 'edificio_solo' | 'casas'
  edificios: EdificioInput[]
  total_unidades: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { estructura }: { estructura: EstructuraInput } = await request.json()

  // Validar límites del plan — usar service role para evitar problemas de RLS
  const db = createAdminClient()
  let { data: admin } = await db
    .from('admins')
    .select('plan, plan_status')
    .eq('id', user.id)
    .single()

  // Si no existe el record (trigger falló), crearlo ahora
  if (!admin) {
    const plan = user.user_metadata?.plan_intend ?? user.user_metadata?.plan ?? 'gratis'
    const planValido = ['gratis','mini','basico','starter','pro','business'].includes(plan) ? plan : 'gratis'
    await db.from('admins').insert({
      id: user.id,
      nombre: user.user_metadata?.nombre ?? 'Administrador',
      email: user.email ?? '',
      telefono: user.user_metadata?.telefono ?? `pending_${user.id}`,
      plan: planValido,
      plan_status: planValido === 'gratis' ? 'active' : 'trial',
      trial_ends_at: planValido === 'gratis' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const { data: adminNuevo } = await db.from('admins').select('plan, plan_status').eq('id', user.id).single()
    admin = adminNuevo
  }

  if (!admin) return NextResponse.json({ error: 'Error al obtener perfil de administrador' }, { status: 500 })

  if (admin.plan_status === 'suspended' || admin.plan_status === 'cancelled') {
    return NextResponse.json({ error: 'Tu plan está suspendido. Contacta a soporte.' }, { status: 403 })
  }

  const limites = PLAN_LIMITES[admin.plan as keyof typeof PLAN_LIMITES]

  const { count: condominiosActuales } = await db
    .from('condominios')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', user.id)

  if ((condominiosActuales ?? 0) >= limites.condominios) {
    return NextResponse.json(
      { error: `Tu plan ${admin.plan} permite máximo ${limites.condominios} condominio(s). Actualiza tu plan para agregar más.` },
      { status: 403 }
    )
  }

  const { count: unidadesActuales } = await db
    .from('unidades')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', user.id)

  const nuevasUnidades = estructura.total_unidades
  if ((unidadesActuales ?? 0) + nuevasUnidades > limites.unidades) {
    return NextResponse.json(
      { error: `Tu plan ${admin.plan} permite máximo ${limites.unidades} unidades en total. Tienes ${unidadesActuales} y quieres agregar ${nuevasUnidades}.` },
      { status: 403 }
    )
  }

  // Crear condominio
  const { data: condominio, error: errorCondominio } = await supabase
    .from('condominios')
    .insert({
      admin_id: user.id,
      nombre: estructura.nombre,
      direccion: estructura.direccion || null,
      tipo: estructura.tipo,
    })
    .select('id')
    .single()

  if (errorCondominio || !condominio) {
    return NextResponse.json({ error: 'Error creando condominio' }, { status: 500 })
  }

  const condominioId = condominio.id

  // Crear edificios y unidades
  for (const ed of estructura.edificios) {
    let edificioId: string | null = null

    if (estructura.tipo !== 'casas') {
      const { data: edificio, error: errorEdificio } = await supabase
        .from('edificios')
        .insert({
          condominio_id: condominioId,
          admin_id: user.id,
          nombre: ed.nombre,
          niveles: ed.niveles,
          tiene_sotano: ed.tiene_sotano,
        })
        .select('id')
        .single()

      if (errorEdificio || !edificio) {
        return NextResponse.json({ error: `Error creando edificio ${ed.nombre}` }, { status: 500 })
      }
      edificioId = edificio.id
    }

    // Insertar unidades en bulk
    const unidadesInsert = ed.unidades.map(codigo => ({
      condominio_id: condominioId,
      edificio_id: edificioId,
      admin_id: user.id,
      codigo,
      tipo: codigo.endsWith('S') ? 'sotano' as const : estructura.tipo === 'casas' ? 'casa' as const : 'apartamento' as const,
      piso: extraerPiso(codigo),
    }))

    const { error: errorUnidades } = await supabase
      .from('unidades')
      .insert(unidadesInsert)

    if (errorUnidades) {
      return NextResponse.json({ error: `Error creando unidades de ${ed.nombre}` }, { status: 500 })
    }
  }

  return NextResponse.json({ condominioId, success: true })
}

function extraerPiso(codigo: string): number | null {
  const num = parseInt(codigo.replace(/[^0-9]/g, ''))
  return isNaN(num) ? null : num
}
