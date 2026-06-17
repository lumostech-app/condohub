import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const CATEGORIA_ICON: Record<string, string> = {
  empleado: '👤', proveedor: '🔧', luz: '💡', agua: '💧',
  gas: '🔥', mantenimiento: '🛠️', otro: '📋',
}

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function ReportesPage({ params, searchParams }: {
  params: { id: string }
  searchParams: { mes?: string; anio?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoy = new Date()
  const mes = parseInt(searchParams.mes ?? String(hoy.getMonth() + 1))
  const anio = parseInt(searchParams.anio ?? String(hoy.getFullYear()))
  const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`
  const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0]

  // Últimos 6 meses para gráfico
  const mesesGrafico = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anio, mes - 1 - (5 - i), 1)
    return { mes: d.getMonth() + 1, anio: d.getFullYear(), label: MESES_CORTO[d.getMonth()] }
  })
  const graficoDesdeFecha = `${mesesGrafico[0].anio}-${String(mesesGrafico[0].mes).padStart(2, '0')}-01`

  const [
    { data: condominio },
    { data: cuotas },
    { data: gastos },
    { data: pagosHistorico },
    { data: gastosHistorico },
  ] = await Promise.all([
    supabase.from('condominios').select('nombre').eq('id', params.id).single(),
    supabase.from('cuotas').select('estado, monto_base, mora_acumulada, total_debido, unidades(codigo, propietarios(nombre))').eq('condominio_id', params.id).eq('mes', mes).eq('anio', anio),
    supabase.from('gastos').select('*').eq('condominio_id', params.id).gte('fecha', fechaInicio).lte('fecha', fechaFin),
    supabase.from('pagos').select('monto, fecha_pago, unidades!inner(condominio_id)').eq('unidades.condominio_id', params.id).gte('fecha_pago', graficoDesdeFecha),
    supabase.from('gastos').select('monto, fecha').eq('condominio_id', params.id).gte('fecha', graficoDesdeFecha),
  ])

  const pagadas = cuotas?.filter(c => c.estado === 'pagado') ?? []
  const morosas = cuotas?.filter(c => c.estado !== 'pagado') ?? []
  const ingresos = pagadas.reduce((s, c) => s + c.total_debido, 0)
  const totalGastos = gastos?.reduce((s, g) => s + g.monto, 0) ?? 0
  const saldo = ingresos - totalGastos

  const gastosPorCategoria = gastos?.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>) ?? {}

  // Datos del gráfico
  const datosGrafico = mesesGrafico.map(m => {
    const inicio = `${m.anio}-${String(m.mes).padStart(2, '0')}-01`
    const fin = new Date(m.anio, m.mes, 0).toISOString().split('T')[0]
    const ingreso = (pagosHistorico ?? []).filter(p => p.fecha_pago >= inicio && p.fecha_pago <= fin).reduce((s, p) => s + p.monto, 0)
    const gasto = (gastosHistorico ?? []).filter(g => g.fecha >= inicio && g.fecha <= fin).reduce((s, g) => s + g.monto, 0)
    return { ...m, ingreso, gasto }
  })
  const maxValor = Math.max(...datosGrafico.map(d => Math.max(d.ingreso, d.gasto)), 1)

  return (
    <main className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/condominios/${params.id}`} className="text-sm text-gray-400">‹ Condominio</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Reporte</h1>
        <p className="text-sm text-gray-400">{condominio?.nombre} · {MESES_LARGO[mes - 1]} {anio}</p>
      </div>

      {/* Selector de mes */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {MESES_CORTO.map((m, i) => (
          <Link
            key={i}
            href={`/condominios/${params.id}/reportes?mes=${i + 1}&anio=${anio}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mes === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m}
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-xs text-green-600 font-semibold uppercase">Recaudado</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(ingresos)}</p>
          <p className="text-xs text-green-500 mt-1">{pagadas.length} de {cuotas?.length ?? 0} cuotas</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-xs text-red-600 font-semibold uppercase">Gastos</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totalGastos)}</p>
          <p className="text-xs text-red-500 mt-1">{gastos?.length ?? 0} registros</p>
        </div>
        <div className={`rounded-2xl p-4 col-span-2 ${saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo neto</p>
              <p className={`text-2xl font-bold mt-0.5 ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(saldo)}</p>
            </div>
            <span className="text-3xl">{saldo >= 0 ? '✅' : '⚠️'}</span>
          </div>
        </div>
      </div>

      {/* Gráfico 6 meses */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Últimos 6 meses</p>
        <div className="flex items-end justify-between gap-2">
          {datosGrafico.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: '72px' }}>
                <div
                  className="flex-1 bg-green-400 rounded-t min-h-[2px]"
                  style={{ height: `${Math.round((d.ingreso / maxValor) * 72)}px` }}
                />
                <div
                  className="flex-1 bg-red-400 rounded-t min-h-[2px]"
                  style={{ height: `${Math.round((d.gasto / maxValor) * 72)}px` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${d.mes === mes && d.anio === anio ? 'text-blue-600' : 'text-gray-400'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 border-t border-gray-50 pt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-400 rounded-sm" /><span className="text-xs text-gray-500">Ingresos</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-sm" /><span className="text-xs text-gray-500">Gastos</span></div>
        </div>
      </div>

      {/* Estado cuotas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estado de cuotas</p>
        <div className="space-y-2.5">
          {[
            { label: 'Pagadas', count: pagadas.length, color: 'bg-green-500' },
            { label: 'Pendientes', count: cuotas?.filter(c => c.estado === 'pendiente').length ?? 0, color: 'bg-yellow-400' },
            { label: 'Morosas', count: cuotas?.filter(c => c.estado === 'moroso').length ?? 0, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20">{item.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full`}
                  style={{ width: `${(cuotas?.length ?? 0) > 0 ? (item.count / (cuotas?.length ?? 1)) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-6 text-right">{item.count}</span>
            </div>
          ))}
        </div>
        {morosas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-500 font-medium mb-1">Unidades pendientes:</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {morosas.map(c => ((c.unidades as unknown) as { codigo: string })?.codigo).join(' · ')}
            </p>
          </div>
        )}
      </div>

      {/* Gastos por categoría */}
      {Object.keys(gastosPorCategoria).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gastos por categoría</p>
            <Link href={`/condominios/${params.id}/gastos`} className="text-xs text-blue-600 font-medium">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {Object.entries(gastosPorCategoria).sort(([,a],[,b]) => (b as number) - (a as number)).map(([cat, monto]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-base">{CATEGORIA_ICON[cat] ?? '📋'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(Number(monto))}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${totalGastos > 0 ? (Number(monto) / totalGastos) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Texto para compartir */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Para compartir</p>
        <p className="font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-line select-all">
{`📊 Informe ${MESES_LARGO[mes - 1]} ${anio}
${condominio?.nombre}

✅ Pagos: ${pagadas.length}/${cuotas?.length ?? 0}
${morosas.length > 0 ? `⏳ Pendientes: ${morosas.map(c => ((c.unidades as unknown) as { codigo: string })?.codigo).join(', ')}` : '✅ Todos al día'}

💰 Ingresos: ${formatCurrency(ingresos)}
📉 Gastos: ${formatCurrency(totalGastos)}
💵 Saldo: ${formatCurrency(saldo)}`}
        </p>
      </div>
    </main>
  )
}
