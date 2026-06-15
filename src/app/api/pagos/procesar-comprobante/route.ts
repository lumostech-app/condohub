import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('imagen') as File | null
  const cuotaId = formData.get('cuota_id') as string
  const unidadId = formData.get('unidad_id') as string

  if (!file) return NextResponse.json({ error: 'Se requiere imagen del comprobante' }, { status: 400 })

  // Subir a Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${user.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(fileName, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Error subiendo imagen' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('comprobantes')
    .getPublicUrl(uploadData.path)

  // Claude Vision
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

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
Extrae: banco emisor, monto, número de referencia, fecha (YYYY-MM-DD).
Responde ÚNICAMENTE con JSON:
{
  "banco": "nombre del banco o null",
  "monto": número_o_null,
  "referencia": "número o null",
  "fecha_pago": "YYYY-MM-DD o null",
  "error": null
}`,
        },
      ],
    }],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
  let extraido: Record<string, unknown>

  try {
    extraido = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'No pude leer el comprobante' }, { status: 422 })
  }

  return NextResponse.json({
    ...extraido,
    comprobante_url: publicUrl,
    cuota_id: cuotaId,
    unidad_id: unidadId,
  })
}
