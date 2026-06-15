import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCronSecret } from '@/lib/cron'

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  let actualizadas = 0
  const errores: string[] = []

  // Cuotas pendientes cuya fecha_limite ya pasó — primera vez morosas
  const { data: cuotasVencidas } = await supabase
    .from('cuotas')
    .select('id, admin_id, condominio_id, unidad_id, monto_base, mora_acumulada, fecha_limite')
    .eq('estado', 'pendiente')
    .lt('fecha_limite', hoyStr)

  for (const cuota of cuotasVencidas ?? []) {
    const { data: config } = await supabase
      .from('config_cuotas')
      .select('dias_gracia, porcentaje_mora, bloqueo_reservas')
      .eq('condominio_id', cuota.condominio_id)
      .single()

    if (!config) continue

    const fechaLimite = new Date(cuota.fecha_limite!)
    const diasVencido = Math.floor((hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24))

    if (diasVencido <= config.dias_gracia) continue

    // Aplicar mora: porcentaje sobre monto_base
    const mora = Math.round(cuota.monto_base * (config.porcentaje_mora / 100))
    const nuevaMoraAcumulada = cuota.mora_acumulada + mora
    const nuevoTotal = cuota.monto_base + nuevaMoraAcumulada

    const { error } = await supabase
      .from('cuotas')
      .update({
        estado: 'moroso',
        mora_acumulada: nuevaMoraAcumulada,
        total_debido: nuevoTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cuota.id)

    if (error) {
      errores.push(`cuota ${cuota.id}: ${error.message}`)
    } else {
      actualizadas++
    }
  }

  // Cuotas ya morosas — acumular mora mensualmente
  // Solo si la cuota lleva exactamente 30 días como morosa (evitar doble cobro diario)
  const { data: cuotasMorosas } = await supabase
    .from('cuotas')
    .select('id, condominio_id, monto_base, mora_acumulada, fecha_limite, updated_at')
    .eq('estado', 'moroso')

  for (const cuota of cuotasMorosas ?? []) {
    const ultimaActualizacion = new Date(cuota.updated_at)
    const diasDesdeUltimaActualizacion = Math.floor(
      (hoy.getTime() - ultimaActualizacion.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Acumular mora cada 30 días
    if (diasDesdeUltimaActualizacion < 30) continue

    const { data: config } = await supabase
      .from('config_cuotas')
      .select('porcentaje_mora')
      .eq('condominio_id', cuota.condominio_id)
      .single()

    if (!config) continue

    const mora = Math.round(cuota.monto_base * (config.porcentaje_mora / 100))
    const nuevaMoraAcumulada = cuota.mora_acumulada + mora

    await supabase
      .from('cuotas')
      .update({
        mora_acumulada: nuevaMoraAcumulada,
        total_debido: cuota.monto_base + nuevaMoraAcumulada,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cuota.id)

    actualizadas++
  }

  console.log(`[calcular-mora] actualizadas=${actualizadas}, errores=${errores.length}`)
  return NextResponse.json({ actualizadas, errores })
}
