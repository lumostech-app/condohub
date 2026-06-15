import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCronSecret } from '@/lib/cron'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoy = new Date()
  const diaDelMes = hoy.getDate()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()
  const mesNombre = hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })

  let enviados = 0
  let sinTelefono = 0
  const errores: string[] = []

  // Determinar tipo de recordatorio según el día
  let tipoRecordatorio: 'inicial' | 'seguimiento' | 'mora' | null = null
  if (diaDelMes === 1) tipoRecordatorio = 'inicial'
  else if (diaDelMes === 5) tipoRecordatorio = 'seguimiento'
  else if (diaDelMes === 15) tipoRecordatorio = 'mora'

  if (!tipoRecordatorio) {
    return NextResponse.json({ message: 'No es día de recordatorio', dia: diaDelMes })
  }

  // Obtener plantilla aprobada
  const { data: plantilla } = await supabase
    .from('whatsapp_plantillas')
    .select('contenido')
    .eq('tipo', tipoRecordatorio === 'mora' ? 'mora' : 'recordatorio_cuota')
    .eq('aprobada_meta', true)
    .limit(1)
    .single()

  if (!plantilla) {
    console.warn(`[recordatorios] Sin plantilla aprobada para tipo: ${tipoRecordatorio}`)
    return NextResponse.json({ message: 'Sin plantillas Meta aprobadas aún', tipo: tipoRecordatorio })
  }

  // Filtrar cuotas según el tipo de recordatorio
  const estadosFiltro = tipoRecordatorio === 'mora' ? ['moroso'] : ['pendiente', 'moroso']

  const { data: cuotas } = await supabase
    .from('cuotas')
    .select(`
      id, total_debido, estado,
      unidades(codigo, propietarios(nombre, telefono)),
      condominios(nombre)
    `)
    .eq('mes', mes)
    .eq('anio', anio)
    .in('estado', estadosFiltro)

  for (const cuota of cuotas ?? []) {
    const unidad = (cuota.unidades as unknown) as {
      codigo: string
      propietarios: { nombre: string; telefono: string | null }[]
    }
    const condominio = (cuota.condominios as unknown) as { nombre: string }
    const propietario = unidad?.propietarios?.[0]

    if (!propietario?.telefono) { sinTelefono++; continue }

    // Interpolar plantilla
    const mensaje = plantilla.contenido
      .replace('{{nombre}}', propietario.nombre.split(' ')[0])
      .replace('{{mes}}', mesNombre)
      .replace('{{condominio}}', condominio?.nombre ?? '')
      .replace('{{monto}}', cuota.total_debido?.toLocaleString() ?? '')
      .replace('{{total}}', cuota.total_debido?.toLocaleString() ?? '')
      .replace('{{fecha_limite}}', '5 días')

    try {
      await sendWhatsAppMessage(propietario.telefono, mensaje)
      enviados++
    } catch (err) {
      errores.push(`${unidad?.codigo}: ${(err as Error).message}`)
    }

    // Pausa para no saturar la API de Twilio
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`[recordatorios] día=${diaDelMes}, tipo=${tipoRecordatorio}, enviados=${enviados}, sinTel=${sinTelefono}`)
  return NextResponse.json({ enviados, sinTelefono, errores, tipo: tipoRecordatorio })
}
