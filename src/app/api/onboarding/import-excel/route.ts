import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const workbook = XLSX.read(bytes, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

  if (rows.length < 2) {
    return NextResponse.json({ error: 'El archivo está vacío o solo tiene encabezados' }, { status: 400 })
  }

  const headers = rows[0].map(String)
  const preview = rows.slice(1, 4).map(row =>
    headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] ?? '' }), {} as Record<string, string>)
  )

  // Claude detecta el mapeo de columnas
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Tienes un Excel de residentes de un condominio en República Dominicana.
Encabezados encontrados: ${headers.join(', ')}
Primeras filas de datos: ${JSON.stringify(preview)}

Mapea cada campo del sistema a la columna más probable del Excel.
Campos del sistema: unidad_codigo, nombre, cedula, telefono, email

Responde ÚNICAMENTE con JSON, sin texto adicional:
{
  "unidad_codigo": "nombre_columna_o_null",
  "nombre": "nombre_columna_o_null",
  "cedula": "nombre_columna_o_null",
  "telefono": "nombre_columna_o_null",
  "email": "nombre_columna_o_null"
}`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
  let mapping: Record<string, string | null>

  try {
    mapping = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Error procesando el archivo' }, { status: 500 })
  }

  // Aplicar mapeo a todas las filas
  const data = rows.slice(1).map(row => {
    const rowObj = headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] ?? '' }), {} as Record<string, string>)
    return {
      unidad_codigo: mapping.unidad_codigo ? String(rowObj[mapping.unidad_codigo] ?? '').trim() : '',
      nombre: mapping.nombre ? String(rowObj[mapping.nombre] ?? '').trim() : '',
      cedula: mapping.cedula ? String(rowObj[mapping.cedula] ?? '').trim() : '',
      telefono: mapping.telefono ? String(rowObj[mapping.telefono] ?? '').trim() : '',
      email: mapping.email ? String(rowObj[mapping.email] ?? '').trim() : '',
    }
  }).filter(r => r.nombre || r.unidad_codigo)

  return NextResponse.json({
    mapping,
    headers,
    preview: data.slice(0, 5),
    total: data.length,
    data,
  })
}
