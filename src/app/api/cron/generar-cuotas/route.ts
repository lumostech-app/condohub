import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCronSecret } from '@/lib/cron'

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  let creadas = 0
  let omitidas = 0
  const errores: string[] = []

  // Obtener todos los admins con plan activo o en trial
  const { data: admins } = await supabase
    .from('admins')
    .select('id, plan, plan_status')
    .in('plan_status', ['active', 'trial'])

  if (!admins?.length) {
    return NextResponse.json({ message: 'Sin admins activos', creadas: 0 })
  }

  for (const admin of admins) {
    // Verificar trial no expirado
    if (admin.plan_status === 'trial') {
      const { data: adminData } = await supabase
        .from('admins')
        .select('trial_ends_at')
        .eq('id', admin.id)
        .single()

      if (adminData?.trial_ends_at && new Date(adminData.trial_ends_at) < hoy) {
        await supabase
          .from('admins')
          .update({ plan_status: 'suspended' })
          .eq('id', admin.id)
        continue
      }
    }

    const { data: condominios } = await supabase
      .from('condominios')
      .select('id')
      .eq('admin_id', admin.id)

    for (const condominio of condominios ?? []) {
      const { data: config } = await supabase
        .from('config_cuotas')
        .select('*')
        .eq('condominio_id', condominio.id)
        .single()

      if (!config) continue

      const { data: unidades } = await supabase
        .from('unidades')
        .select('id')
        .eq('condominio_id', condominio.id)

      for (const unidad of unidades ?? []) {
        // Verificar si ya existe la cuota de este mes
        const { data: existente } = await supabase
          .from('cuotas')
          .select('id')
          .eq('unidad_id', unidad.id)
          .eq('mes', mes)
          .eq('anio', anio)
          .single()

        if (existente) { omitidas++; continue }

        // Calcular fecha límite
        const fechaLimite = new Date(anio, mes - 1, config.dia_cobro)
        if (fechaLimite < hoy) {
          fechaLimite.setMonth(fechaLimite.getMonth() + 1)
        }

        const { error } = await supabase.from('cuotas').insert({
          admin_id: admin.id,
          unidad_id: unidad.id,
          condominio_id: condominio.id,
          mes,
          anio,
          monto_base: config.monto_base,
          mora_acumulada: 0,
          total_debido: config.monto_base,
          estado: 'pendiente',
          fecha_limite: fechaLimite.toISOString().split('T')[0],
        })

        if (error) {
          errores.push(`${unidad.id}: ${error.message}`)
        } else {
          creadas++
        }
      }
    }
  }

  console.log(`[generar-cuotas] ${mes}/${anio}: creadas=${creadas}, omitidas=${omitidas}, errores=${errores.length}`)
  return NextResponse.json({ creadas, omitidas, errores, mes, anio })
}
