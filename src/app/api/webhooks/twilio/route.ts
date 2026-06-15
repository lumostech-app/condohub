import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { twimlResponse, sendWhatsAppMessage, getMesNombreBot } from '@/lib/whatsapp'

// ─── Tipos de contexto de conversación ───────────────────────────────────────

interface ContextoPendiente {
  tipo: 'confirmar_pago_admin' | 'confirmar_pago_residente'
  datos: {
    unidad_id?: string
    unidad_codigo?: string
    propietario_nombre?: string
    cuota_id?: string
    monto?: number
    banco?: string
    referencia?: string
    fecha_pago?: string
    comprobante_url?: string
    admin_telefono?: string
  }
}

interface Contexto {
  condominio_activo_id?: string
  pendiente?: ContextoPendiente
}

// ─── Validación de firma Twilio ───────────────────────────────────────────────

function validateTwilioSignature(request: NextRequest, params: Record<string, string>): boolean {
  const signature = request.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, signature, url, params)
}

// ─── Procesar comprobante con Claude Vision ───────────────────────────────────

async function procesarComprobante(mediaUrl: string): Promise<{
  banco: string | null
  monto: number | null
  referencia: string | null
  fecha_pago: string | null
  error: string | null
}> {
  const imageRes = await fetch(mediaUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')}`,
    },
  })

  if (!imageRes.ok) return { banco: null, monto: null, referencia: null, fecha_pago: null, error: 'No pude descargar la imagen' }

  const buffer = await imageRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType = (imageRes.headers.get('content-type') ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        {
          type: 'text',
          text: `Analiza este comprobante de transferencia bancaria de República Dominicana.
Extrae exactamente:
1. Banco emisor (ej: Banreservas, Popular, BHD León, Scotiabank, etc.)
2. Monto transferido (solo el número, sin RD$ ni comas)
3. Número de referencia o confirmación
4. Fecha de la transacción (formato YYYY-MM-DD)

Responde ÚNICAMENTE con JSON válido:
{
  "banco": "nombre del banco o null",
  "monto": número_o_null,
  "referencia": "número o null",
  "fecha_pago": "YYYY-MM-DD o null",
  "error": null
}

Si no puedes leer el comprobante:
{ "error": "descripción del problema" }`,
        },
      ],
    }],
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    return JSON.parse(raw)
  } catch {
    return { banco: null, monto: null, referencia: null, fecha_pago: null, error: 'No pude leer el comprobante' }
  }
}

// ─── Procesar comando de texto del admin con Claude ───────────────────────────

async function interpretarComando(
  texto: string,
  unidades: string[],
  condominioNombre: string,
  morosos: string[]
): Promise<{
  intencion: string
  datos: Record<string, string | number | null>
  respuesta: string
}> {
  const hoy = new Date().toLocaleDateString('es-DO')
  const mes = new Date().getMonth() + 1
  const anio = new Date().getFullYear()

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Eres el asistente de CondoHub para ${condominioNombre}.
UNIDADES DEL CONDOMINIO: ${unidades.join(', ')}
MOROSOS ESTE MES: ${morosos.length > 0 ? morosos.join(', ') : 'ninguno'}
FECHA HOY: ${hoy}
MES ACTUAL: ${mes}/${anio}

Interpreta el siguiente mensaje del administrador e identifica:
1. INTENCIÓN (pago_cuota | gasto | consulta_morosos | consulta_balance | reporte | cambio_condominio | desconocido)
2. DATOS EXTRAÍDOS según la intención

Responde ÚNICAMENTE con JSON válido:
{
  "intencion": "",
  "datos": {
    "unidad_codigo": null,
    "monto": null,
    "categoria": null,
    "descripcion": null,
    "mes": null,
    "condominio_nombre": null
  },
  "respuesta": "respuesta breve en español dominicano si no entendiste o necesitas más info"
}

Mensaje del administrador: "${texto}"`,
    }],
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    return JSON.parse(raw)
  } catch {
    return { intencion: 'desconocido', datos: {}, respuesta: 'No entendí eso. Prueba: "morosos", "pago A3", "gasto luz 4500", "reporte"' }
  }
}

// ─── Handler del administrador ────────────────────────────────────────────────

async function handleAdmin(
  supabase: ReturnType<typeof createAdminClient>,
  admin: { id: string; nombre: string; telefono: string },
  conversacion: { id: string; contexto: Contexto },
  texto: string,
  mediaUrl: string | null,
  fromNumber: string
): Promise<string> {
  const contexto: Contexto = conversacion.contexto ?? {}
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  // ── Manejo de confirmación pendiente ──────────────────────────────────────
  if (contexto.pendiente) {
    const pendiente = contexto.pendiente
    const respuesta_lower = texto.toLowerCase().trim()
    const esConfirmacion = ['sí', 'si', 's', 'yes', 'ok', 'dale', 'confirmo'].includes(respuesta_lower)
    const esCancelacion = ['no', 'cancelar', 'cancel'].includes(respuesta_lower)

    if (esConfirmacion && pendiente.tipo === 'confirmar_pago_admin') {
      const d = pendiente.datos

      const { data: cuota } = await supabase
        .from('cuotas')
        .select('id')
        .eq('unidad_id', d.unidad_id!)
        .eq('mes', mes)
        .eq('anio', anio)
        .neq('estado', 'pagado')
        .single()

      if (!cuota) {
        await actualizarContexto(supabase, conversacion.id, {})
        return `⚠️ No encontré una cuota pendiente para ${d.unidad_codigo}. Puede que ya esté pagada.`
      }

      await supabase.from('pagos').insert({
        admin_id: admin.id,
        cuota_id: cuota.id,
        unidad_id: d.unidad_id!,
        monto: d.monto!,
        fecha_pago: d.fecha_pago ?? hoy.toISOString().split('T')[0],
        metodo: 'transferencia',
        banco: d.banco ?? null,
        referencia: d.referencia ?? null,
        comprobante_url: d.comprobante_url ?? null,
        registrado_por: 'admin',
      })

      await supabase
        .from('cuotas')
        .update({ estado: 'pagado', updated_at: new Date().toISOString() })
        .eq('id', cuota.id)

      await actualizarContexto(supabase, conversacion.id, {})
      return `✅ Pago registrado.\n📍 ${d.unidad_codigo} — ${d.propietario_nombre ?? 'Sin propietario'}\n💰 RD$${d.monto?.toLocaleString()}\n${d.banco ? `🏦 ${d.banco}` : ''}\nCuota ${getMesNombreBot(mes, anio)} marcada como PAGADA`
    }

    if (esCancelacion || esConfirmacion === false) {
      await actualizarContexto(supabase, conversacion.id, {})
      return '❌ Operación cancelada.'
    }
  }

  // ── Cargar condominio activo ───────────────────────────────────────────────
  const { data: condominios } = await supabase
    .from('condominios')
    .select('id, nombre')
    .eq('admin_id', admin.id)
    .order('created_at', { ascending: true })

  if (!condominios?.length) {
    return 'No tienes condominios registrados. Crea uno en condohub.com'
  }

  let condominioActivo = condominios.find(c => c.id === contexto.condominio_activo_id) ?? condominios[0]

  // ── Imagen recibida → procesar comprobante ────────────────────────────────
  if (mediaUrl) {
    const unidadCodigo = texto.replace(/pago/i, '').trim().toUpperCase() || null

    const comprobante = await procesarComprobante(mediaUrl)
    if (comprobante.error) {
      return `⚠️ ${comprobante.error}\nIntenta con una imagen más clara del comprobante.`
    }

    if (!unidadCodigo) {
      await actualizarContexto(supabase, conversacion.id, {
        ...contexto,
        pendiente: {
          tipo: 'confirmar_pago_admin',
          datos: { monto: comprobante.monto ?? undefined, banco: comprobante.banco ?? undefined, referencia: comprobante.referencia ?? undefined, fecha_pago: comprobante.fecha_pago ?? undefined }
        }
      })
      return `Encontré en el comprobante:\n💰 RD$${comprobante.monto?.toLocaleString() ?? '?'}\n🏦 ${comprobante.banco ?? '?'}\n🔢 ${comprobante.referencia ?? '?'}\n\n¿A qué unidad corresponde este pago?`
    }

    const { data: unidad } = await supabase
      .from('unidades')
      .select('id, codigo, propietarios(nombre)')
      .eq('condominio_id', condominioActivo.id)
      .ilike('codigo', unidadCodigo)
      .single()

    if (!unidad) {
      return `❌ No encontré la unidad ${unidadCodigo} en ${condominioActivo.nombre}.`
    }

    const propietarioNombre = (unidad.propietarios as { nombre: string }[])?.[0]?.nombre ?? 'Sin propietario'

    const nuevoPendiente: ContextoPendiente = {
      tipo: 'confirmar_pago_admin',
      datos: {
        unidad_id: unidad.id,
        unidad_codigo: unidad.codigo,
        propietario_nombre: propietarioNombre,
        monto: comprobante.monto ?? undefined,
        banco: comprobante.banco ?? undefined,
        referencia: comprobante.referencia ?? undefined,
        fecha_pago: comprobante.fecha_pago ?? undefined,
      }
    }

    await actualizarContexto(supabase, conversacion.id, { ...contexto, pendiente: nuevoPendiente })

    return `✅ Encontré esto en el comprobante:
📍 Unidad: ${unidad.codigo} — ${propietarioNombre}
💰 Monto: RD$${comprobante.monto?.toLocaleString() ?? '?'}
🏦 Banco: ${comprobante.banco ?? '?'}
🔢 Ref: ${comprobante.referencia ?? '?'}
📅 Fecha: ${comprobante.fecha_pago ?? 'hoy'}

¿Confirmo el pago? (sí/no)`
  }

  // ── Procesar texto con Claude ──────────────────────────────────────────────
  const { data: unidades } = await supabase
    .from('unidades')
    .select('codigo')
    .eq('condominio_id', condominioActivo.id)

  const { data: cuotasMorosas } = await supabase
    .from('cuotas')
    .select('codigo:unidades(codigo)')
    .eq('condominio_id', condominioActivo.id)
    .eq('mes', mes)
    .eq('anio', anio)
    .in('estado', ['moroso', 'pendiente'])

  const codigosUnidades = unidades?.map(u => u.codigo) ?? []
  const codigosMorosos = (cuotasMorosas ?? []).map((c) => {
    const u = ((c as unknown) as { unidades: { codigo: string } | { codigo: string }[] }).unidades
    const unidadObj = Array.isArray(u) ? u[0] : u
    return (unidadObj as { codigo: string } | undefined)?.codigo ?? ''
  }).filter(Boolean)

  const interpretacion = await interpretarComando(
    texto,
    codigosUnidades,
    condominioActivo.nombre,
    codigosMorosos
  )

  // ── Ejecutar acción según intención ───────────────────────────────────────
  switch (interpretacion.intencion) {

    case 'consulta_morosos': {
      if (codigosMorosos.length === 0) {
        return `✅ Sin morosos este mes en ${condominioActivo.nombre}.\nTodas las unidades al día.`
      }
      return `📋 Morosos ${getMesNombreBot(mes, anio)} — ${condominioActivo.nombre}:\n${codigosMorosos.map(c => `• ${c}`).join('\n')}\n\nTotal: ${codigosMorosos.length} unidades`
    }

    case 'consulta_balance': {
      const codigo = String(interpretacion.datos.unidad_codigo ?? '').toUpperCase()
      if (!codigo) return '¿De qué unidad quieres el balance?'

      const { data: cuota } = await supabase
        .from('cuotas')
        .select('total_debido, mora_acumulada, estado, unidades(codigo, propietarios(nombre))')
        .eq('condominio_id', condominioActivo.id)
        .ilike('unidades.codigo', codigo)
        .eq('mes', mes)
        .eq('anio', anio)
        .single()

      if (!cuota) return `No encontré cuota activa para la unidad ${codigo}.`

      const unidadInfo = (cuota.unidades as unknown) as { codigo: string; propietarios: { nombre: string }[] }
      return `💰 Balance ${codigo} — ${getMesNombreBot(mes, anio)}:
👤 ${unidadInfo?.propietarios?.[0]?.nombre ?? 'Sin propietario'}
Estado: ${cuota.estado.toUpperCase()}
Total debido: RD$${cuota.total_debido?.toLocaleString()}
${cuota.mora_acumulada > 0 ? `⚠️ Mora: RD$${cuota.mora_acumulada?.toLocaleString()}` : ''}`
    }

    case 'pago_cuota': {
      const codigo = String(interpretacion.datos.unidad_codigo ?? '').toUpperCase()
      const monto = Number(interpretacion.datos.monto)

      if (!codigo) return '¿A qué unidad corresponde el pago? Ej: "pago A3 3500"'
      if (!monto) return `¿Cuánto fue el monto del pago de ${codigo}?`

      const { data: unidad } = await supabase
        .from('unidades')
        .select('id, codigo, propietarios(nombre)')
        .eq('condominio_id', condominioActivo.id)
        .ilike('codigo', codigo)
        .single()

      if (!unidad) return `❌ Unidad ${codigo} no encontrada en ${condominioActivo.nombre}.`

      const propietarioNombre = (unidad.propietarios as { nombre: string }[])?.[0]?.nombre ?? 'Sin propietario'
      const nuevoPendiente: ContextoPendiente = {
        tipo: 'confirmar_pago_admin',
        datos: {
          unidad_id: unidad.id,
          unidad_codigo: unidad.codigo,
          propietario_nombre: propietarioNombre,
          monto,
          fecha_pago: hoy.toISOString().split('T')[0],
        }
      }

      await actualizarContexto(supabase, conversacion.id, { ...contexto, pendiente: nuevoPendiente })
      return `Confirmación de pago:
📍 ${unidad.codigo} — ${propietarioNombre}
💰 RD$${monto.toLocaleString()}
📅 ${hoy.toLocaleDateString('es-DO')}

¿Confirmo el pago? (sí/no)`
    }

    case 'gasto': {
      const descripcion = String(interpretacion.datos.descripcion ?? interpretacion.datos.categoria ?? '')
      const monto = Number(interpretacion.datos.monto)
      const categoria = String(interpretacion.datos.categoria ?? 'otro')

      if (!monto) return '¿Cuánto fue el monto del gasto? Ej: "gasto luz 4500"'

      const categoriaValida = ['empleado','proveedor','luz','agua','gas','mantenimiento','otro'].includes(categoria)
        ? categoria : 'otro'

      await supabase.from('gastos').insert({
        admin_id: admin.id,
        condominio_id: condominioActivo.id,
        categoria: categoriaValida,
        descripcion: descripcion || categoriaValida,
        monto,
        fecha: hoy.toISOString().split('T')[0],
      })

      return `✅ Gasto registrado:
📋 ${descripcion || categoriaValida}
💰 RD$${monto.toLocaleString()}
📅 ${hoy.toLocaleDateString('es-DO')}`
    }

    case 'reporte': {
      const { data: cuotas } = await supabase
        .from('cuotas')
        .select('estado, total_debido')
        .eq('condominio_id', condominioActivo.id)
        .eq('mes', mes)
        .eq('anio', anio)

      const { data: gastos } = await supabase
        .from('gastos')
        .select('categoria, monto')
        .eq('condominio_id', condominioActivo.id)
        .gte('fecha', `${anio}-${String(mes).padStart(2, '0')}-01`)

      const pagadas = cuotas?.filter(c => c.estado === 'pagado') ?? []
      const pendientes = cuotas?.filter(c => c.estado !== 'pagado') ?? []
      const ingresos = pagadas.reduce((s, c) => s + c.total_debido, 0)
      const totalGastos = gastos?.reduce((s, g) => s + g.monto, 0) ?? 0

      const gastosPorCategoria = gastos?.reduce((acc, g) => {
        acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto
        return acc
      }, {} as Record<string, number>)

      return `📊 Reporte ${getMesNombreBot(mes, anio)}
${condominioActivo.nombre}

✅ Pagos: ${pagadas.length}/${cuotas?.length ?? 0}
⏳ Pendientes: ${pendientes.map(c => '').join('')}${codigosMorosos.slice(0, 5).join(', ')}${codigosMorosos.length > 5 ? ` y ${codigosMorosos.length - 5} más` : ''}

💰 Ingresos: RD$${ingresos.toLocaleString()}
📉 Gastos: RD$${totalGastos.toLocaleString()}
${Object.entries(gastosPorCategoria ?? {}).map(([k, v]) => `   • ${k}: RD$${v.toLocaleString()}`).join('\n')}
✅ Saldo: RD$${(ingresos - totalGastos).toLocaleString()}`
    }

    case 'cambio_condominio': {
      const nombreBuscado = String(interpretacion.datos.condominio_nombre ?? '').toLowerCase()
      const encontrado = condominios.find(c => c.nombre.toLowerCase().includes(nombreBuscado))

      if (!encontrado) {
        const lista = condominios.map(c => `• ${c.nombre}`).join('\n')
        return `No encontré ese condominio. Tienes:\n${lista}`
      }

      await actualizarContexto(supabase, conversacion.id, { condominio_activo_id: encontrado.id })
      return `✅ Cambiado a: ${encontrado.nombre}`
    }

    default: {
      if (interpretacion.respuesta) return interpretacion.respuesta
      return `No entendí ese mensaje. Prueba:\n• "morosos"\n• "pago A3" + foto\n• "gasto luz 4500"\n• "cuanto debe B2"\n• "reporte"`
    }
  }
}

// ─── Handler del residente ────────────────────────────────────────────────────

async function handleResidente(
  supabase: ReturnType<typeof createAdminClient>,
  propietario: { id: string; nombre: string; unidad_id: string; admin_id: string; admin_telefono: string },
  conversacion: { id: string; contexto: Contexto },
  texto: string,
  mediaUrl: string | null
): Promise<string> {
  const contexto: Contexto = conversacion.contexto ?? {}
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  // ── Confirmación pendiente ──────────────────────────────────────────────
  if (contexto.pendiente?.tipo === 'confirmar_pago_residente') {
    const esConfirmacion = ['sí', 'si', 's', 'yes', 'ok', 'confirmo'].includes(texto.toLowerCase().trim())
    const esCancelacion = ['no', 'cancelar'].includes(texto.toLowerCase().trim())

    if (esConfirmacion) {
      const d = contexto.pendiente.datos

      const { data: cuota } = await supabase
        .from('cuotas')
        .select('id')
        .eq('unidad_id', propietario.unidad_id)
        .eq('mes', mes)
        .eq('anio', anio)
        .neq('estado', 'pagado')
        .single()

      if (!cuota) {
        await actualizarContexto(supabase, conversacion.id, {})
        return '⚠️ No encontré cuota pendiente para tu unidad. Puede que ya esté pagada.'
      }

      await supabase.from('pagos').insert({
        admin_id: propietario.admin_id,
        cuota_id: cuota.id,
        unidad_id: propietario.unidad_id,
        monto: d.monto!,
        fecha_pago: d.fecha_pago ?? hoy.toISOString().split('T')[0],
        metodo: 'transferencia',
        banco: d.banco ?? null,
        referencia: d.referencia ?? null,
        comprobante_url: d.comprobante_url ?? null,
        registrado_por: 'residente',
      })

      await supabase
        .from('cuotas')
        .update({ estado: 'pagado', updated_at: new Date().toISOString() })
        .eq('id', cuota.id)

      await actualizarContexto(supabase, conversacion.id, {})

      // Notificar al admin
      const { data: unidad } = await supabase
        .from('unidades')
        .select('codigo')
        .eq('id', propietario.unidad_id)
        .single()

      if (propietario.admin_telefono) {
        await sendWhatsAppMessage(
          propietario.admin_telefono,
          `💰 Nuevo pago recibido:\n📍 ${unidad?.codigo} — ${propietario.nombre}\nRD$${d.monto?.toLocaleString()} | ${d.banco ?? 'Transferencia'} | ✅ Registrado`
        ).catch(() => {/* non-critical */})
      }

      return `✅ ¡Pago registrado!\nGracias ${propietario.nombre.split(' ')[0]}, tu cuota de ${getMesNombreBot(mes, anio)} quedó registrada.`
    }

    if (esCancelacion) {
      await actualizarContexto(supabase, conversacion.id, {})
      return 'Cancelado. Si tienes alguna duda contacta a tu administrador.'
    }
  }

  // ── Imagen recibida → procesar comprobante ────────────────────────────────
  if (mediaUrl) {
    const comprobante = await procesarComprobante(mediaUrl)

    if (comprobante.error) {
      return `⚠️ ${comprobante.error}\nIntenta con una imagen más clara.`
    }

    const nuevoPendiente: ContextoPendiente = {
      tipo: 'confirmar_pago_residente',
      datos: {
        monto: comprobante.monto ?? undefined,
        banco: comprobante.banco ?? undefined,
        referencia: comprobante.referencia ?? undefined,
        fecha_pago: comprobante.fecha_pago ?? undefined,
        admin_telefono: propietario.admin_telefono,
      }
    }

    await actualizarContexto(supabase, conversacion.id, { pendiente: nuevoPendiente })

    return `✅ Recibimos tu comprobante:
💰 Monto: RD$${comprobante.monto?.toLocaleString() ?? '?'}
🏦 Banco: ${comprobante.banco ?? '?'}
📅 Fecha: ${comprobante.fecha_pago ?? 'hoy'}

¿Confirmo tu pago? (sí/no)`
  }

  return `Hola ${propietario.nombre.split(' ')[0]} 👋\nPara registrar tu pago, envía la foto del comprobante de transferencia.`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function actualizarContexto(
  supabase: ReturnType<typeof createAdminClient>,
  conversacionId: string,
  contexto: Contexto
) {
  await supabase
    .from('whatsapp_conversaciones')
    .update({ contexto, ultimo_mensaje: new Date().toISOString() })
    .eq('id', conversacionId)
}

// ─── Handler principal del webhook ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  const bodyText = await request.text()
  const params = Object.fromEntries(new URLSearchParams(bodyText))

  // Validar firma de Twilio (skip en desarrollo local)
  if (process.env.NODE_ENV === 'production') {
    if (!validateTwilioSignature(request, params)) {
      return new NextResponse('Unauthorized', { status: 403 })
    }
  }

  const from: string = params.From ?? ''
  const texto: string = (params.Body ?? '').trim()
  const numMedia = parseInt(params.NumMedia ?? '0')
  const mediaUrl: string | null = numMedia > 0 ? (params.MediaUrl0 ?? null) : null

  // Normalizar número (quitar "whatsapp:")
  const telefono = from.replace('whatsapp:', '')

  if (!telefono) return twimlResponse('Error: número no identificado')

  const supabase = createAdminClient()

  // ── Cargar o crear conversación ──────────────────────────────────────────
  let conversacion = await supabase
    .from('whatsapp_conversaciones')
    .select('id, admin_id, tipo_usuario, contexto')
    .eq('telefono', telefono)
    .single()
    .then(r => r.data)

  // ── Identificar usuario ──────────────────────────────────────────────────
  const { data: admin } = await supabase
    .from('admins')
    .select('id, nombre, telefono')
    .eq('telefono', telefono)
    .single()

  let tipoUsuario: 'admin' | 'residente' | 'desconocido' = 'desconocido'
  if (admin) tipoUsuario = 'admin'

  const propietarioQuery = !admin
    ? await supabase
        .from('propietarios')
        .select('id, nombre, unidad_id, admin_id, admins(telefono)')
        .eq('telefono', telefono)
        .single()
    : null

  const propietario = propietarioQuery?.data
  if (propietario) tipoUsuario = 'residente'

  // ── Crear o actualizar conversación ──────────────────────────────────────
  if (!conversacion) {
    const { data: nueva } = await supabase
      .from('whatsapp_conversaciones')
      .insert({
        telefono,
        admin_id: admin?.id ?? propietario?.admin_id ?? null,
        tipo_usuario: tipoUsuario,
        ultimo_mensaje: new Date().toISOString(),
        contexto: {},
      })
      .select('id, admin_id, tipo_usuario, contexto')
      .single()
    conversacion = nueva
  } else if (conversacion.tipo_usuario !== tipoUsuario) {
    await supabase
      .from('whatsapp_conversaciones')
      .update({ tipo_usuario: tipoUsuario, ultimo_mensaje: new Date().toISOString() })
      .eq('id', conversacion.id)
  }

  if (!conversacion) return twimlResponse('Error interno. Intenta de nuevo.')

  // ── Rutear por tipo de usuario ────────────────────────────────────────────
  let respuesta: string

  if (tipoUsuario === 'admin' && admin) {
    respuesta = await handleAdmin(
      supabase,
      admin,
      { id: conversacion.id, contexto: (conversacion.contexto as Contexto) ?? {} },
      texto,
      mediaUrl,
      from
    )
  } else if (tipoUsuario === 'residente' && propietario) {
    const adminTelefono = ((propietario.admins as unknown) as { telefono: string } | undefined)?.telefono ?? ''
    respuesta = await handleResidente(
      supabase,
      { ...propietario, admin_telefono: adminTelefono },
      { id: conversacion.id, contexto: (conversacion.contexto as Contexto) ?? {} },
      texto,
      mediaUrl
    )
  } else {
    respuesta = `Hola 👋 Este es el sistema CondoHub de administración de condominios.\nSi eres residente, tu administrador debe registrar tu número en el sistema.`
  }

  return twimlResponse(respuesta)
}
