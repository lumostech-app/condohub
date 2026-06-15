import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { condominioId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const hoy = new Date()
  const mes = parseInt(searchParams.get('mes') ?? String(hoy.getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(hoy.getFullYear()))
  const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`
  const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0]

  const { data: condominio } = await supabase
    .from('condominios')
    .select('nombre')
    .eq('id', params.condominioId)
    .single()

  const [
    { data: cuotas },
    { data: gastos },
    { data: pagos },
  ] = await Promise.all([
    supabase
      .from('cuotas')
      .select('estado, monto_base, mora_acumulada, total_debido, unidades(codigo, propietarios(nombre))')
      .eq('condominio_id', params.condominioId)
      .eq('mes', mes)
      .eq('anio', anio),
    supabase
      .from('gastos')
      .select('*')
      .eq('condominio_id', params.condominioId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin),
    supabase
      .from('pagos')
      .select('monto, fecha_pago, banco, metodo, unidades(codigo)')
      .eq('condominio_id', params.condominioId ?? '')
      .gte('fecha_pago', fechaInicio)
      .lte('fecha_pago', fechaFin),
  ])

  const pagadas = cuotas?.filter(c => c.estado === 'pagado') ?? []
  const morosas = cuotas?.filter(c => c.estado === 'moroso') ?? []
  const pendientes = cuotas?.filter(c => c.estado === 'pendiente') ?? []

  const ingresos = pagadas.reduce((s, c) => s + c.total_debido, 0)
  const totalGastos = gastos?.reduce((s, g) => s + g.monto, 0) ?? 0

  const gastosPorCategoria = gastos?.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    condominio: condominio?.nombre,
    mes,
    anio,
    cuotas: {
      total: cuotas?.length ?? 0,
      pagadas: pagadas.length,
      morosas: morosas.length,
      pendientes: pendientes.length,
    },
    morosos: morosas.map(c => {
      const u = (c.unidades as unknown) as { codigo: string; propietarios: { nombre: string }[] }
      return { codigo: u?.codigo, propietario: u?.propietarios?.[0]?.nombre, total: c.total_debido, mora: c.mora_acumulada }
    }),
    ingresos,
    gastos: totalGastos,
    saldo: ingresos - totalGastos,
    gastosPorCategoria,
    detalleGastos: gastos ?? [],
    pagosRecibidos: pagos ?? [],
  })
}
