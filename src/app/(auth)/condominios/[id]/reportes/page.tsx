import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const CATEGORIA_ICON: Record<string, string> = {
  empleado: '👤', proveedor: '🔧', luz: '💡', agua: '💧',
  gas: '🔥', mantenimiento: '🛠️', otro: '📋',
}

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

  const [
    { data: condominio },
    { data: cuotas },
    { data: gastos },
  ] = await Promise.all([
    supabase.from('condominios').select('nombre').eq('id', params.id).single(),
    supabase.from('cuotas').select('estado, monto_base, mora_acumulada, total_debido, unidades(codigo, propietarios(nombre))').eq('condominio_id', params.id).eq('mes', mes).eq('anio', anio),
    supabase.from('gastos').select('*').eq('condominio_id', params.id).gte('fecha', fechaInicio).lte('fecha', fechaFin),
  ])

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const pagadas = cuotas?.filter(c => c.estado === 'pagado') ?? []
  const morosas = cuotas?.filter(c => c.estado !== 'pagado') ?? []
  const ingresos = pagadas.reduce((s, c) => s + c.total_debido, 0)
  const totalGastos = gastos?.reduce((s, g) => s + g.monto, 0) ?? 0
  const saldo = ingresos - totalGastos

  const gastosPorCategoria = gastos?.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href={`/condominios/${params.id}`} className="text-sm text-gray-400">‹ Volver</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Reporte mensual</h1>
      </div>

      {/* Selector de mes */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {MESES.map((m, i) => (
          <Link
            key={i}
            href={`/condominios/${params.id}/reportes?mes=${i + 1}&anio=${anio}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mes === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m.slice(0, 3)}
          </Link>
        ))}
      </div>

      {/* Header del reporte */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-4">
        <p className="text-blue-200 text-sm font-medium">📊 {condominio?.nombre}</p>
        <p className="text-2xl font-bold mt-1">{MESES[mes - 1]} {anio}</p>
      </div>

      {/* Estado de cuotas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuotas</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{pagadas.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pagadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{cuotas?.filter(c => c.estado === 'pendiente').length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{cuotas?.filter(c => c.estado === 'moroso').length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Morosas</p>
          </div>
        </div>
        {morosas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-1">Pendientes:</p>
            <p className="text-xs text-gray-400">
              {morosas.map(c => {
                const u = (c.unidades as unknown) as { codigo: string }
                return u?.codigo
              }).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Balance financiero */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Balance</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">💰 Ingresos</p>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(ingresos)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">📉 Gastos</p>
            <p className="text-sm font-semibold text-red-500">{formatCurrency(totalGastos)}</p>
          </div>
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Saldo disponible</p>
            <p className={`text-base font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalle de gastos */}
      {Object.keys(gastosPorCategoria).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Detalle de gastos</p>
          <div className="space-y-2">
            {Object.entries(gastosPorCategoria).map(([cat, monto]) => (
              <div key={cat} className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {CATEGORIA_ICON[cat] ?? '📋'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </p>
                <p className="text-sm font-medium text-gray-800">{formatCurrency(Number(monto))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Texto para compartir */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Para compartir en WhatsApp</p>
        <p className="text-sm text-gray-700 whitespace-pre-line font-mono text-xs leading-relaxed">
{`📊 Informe ${MESES[mes - 1]} ${anio}
${condominio?.nombre}

✅ Pagos: ${pagadas.length}/${cuotas?.length ?? 0}
${morosas.length > 0 ? `⏳ Pendientes: ${morosas.map(c => ((c.unidades as unknown) as { codigo: string })?.codigo).join(', ')}` : '✅ Todos al día'}

💰 Ingresos: ${formatCurrency(ingresos)}
📉 Gastos: ${formatCurrency(totalGastos)}
✅ Saldo: ${formatCurrency(saldo)}`}
        </p>
      </div>
    </main>
  )
}
