import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const hoy = new Date()
  const mes = parseInt(searchParams.get('mes') ?? String(hoy.getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(hoy.getFullYear()))

  const { data: condominio } = await supabase
    .from('condominios')
    .select('nombre')
    .eq('id', params.condominioId)
    .single()

  const { data: cuotas } = await supabase
    .from('cuotas')
    .select('*, unidades(codigo, propietarios(nombre, telefono, cedula))')
    .eq('condominio_id', params.condominioId)
    .eq('mes', mes)
    .eq('anio', anio)
    .order('unidades(codigo)', { ascending: true })

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const nombreMes = MESES[mes - 1]

  const filas = (cuotas ?? []).map(c => {
    const unidad = (c.unidades as unknown) as { codigo: string; propietarios: { nombre: string; telefono: string | null; cedula: string | null }[] } | null
    const propietario = unidad?.propietarios?.[0]
    return {
      'Unidad': unidad?.codigo ?? '',
      'Propietario': propietario?.nombre ?? 'Sin propietario',
      'Teléfono': propietario?.telefono ?? '',
      'Cédula': propietario?.cedula ?? '',
      'Estado': c.estado,
      'Monto Base (RD$)': c.monto_base,
      'Mora (RD$)': c.mora_acumulada,
      'Total Debido (RD$)': c.total_debido,
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(filas)

  ws['!cols'] = [
    { wch: 10 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, `${nombreMes} ${anio}`)

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `cuotas-${condominio?.nombre ?? params.condominioId}-${nombreMes}-${anio}.xlsx`
    .toLowerCase().replace(/\s+/g, '-')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
