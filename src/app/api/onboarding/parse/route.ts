import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { descripcion } = await request.json()
  if (!descripcion?.trim()) {
    return NextResponse.json({ error: 'La descripción está vacía' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Eres un asistente de configuración de CondoHub para República Dominicana.
El administrador va a describir su condominio en lenguaje natural.
Extrae y estructura en JSON.

Reglas:
- Edificios por letra (A, B, C) o número (Torre 1, Torre 2)
- Unidades: letra_edificio + número_piso (A1, A2, B1...)
- Sótanos: "AS", "BS", "ES" según edificio — van primero en el array
- "4 niveles" = apartamentos del 1 al 4
- "3 pisos" = apartamentos del 1 al 3
- Para casas sin edificios: lista directa de unidades (Casa 1, Casa 2 o C1, C2, etc.)
- Tipo: residencial_multi (varios edificios) | edificio_solo (un edificio) | casas
- Si no se menciona dirección, dejar vacía

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown:
{
  "nombre": "",
  "direccion": "",
  "tipo": "residencial_multi | edificio_solo | casas",
  "edificios": [
    {
      "nombre": "",
      "niveles": 0,
      "tiene_sotano": false,
      "unidades": ["A1", "A2"]
    }
  ],
  "total_unidades": 0,
  "error": null
}

Si no puedes interpretar la descripción, responde:
{ "error": "mensaje explicando qué falta o qué no entendiste" }

Descripción del administrador:
${descripcion}`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const estructura = JSON.parse(rawText)
    if (estructura.error) {
      return NextResponse.json({ error: estructura.error }, { status: 422 })
    }
    return NextResponse.json({ estructura })
  } catch {
    return NextResponse.json(
      { error: 'No pude procesar la respuesta. Intenta describir el condominio con más detalle.' },
      { status: 422 }
    )
  }
}
