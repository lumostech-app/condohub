import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: admin } = await supabase.from('admins').select('*').single()

  const { data: condominios } = await supabase
    .from('condominios')
    .select('id, nombre, tipo')
    .order('created_at', { ascending: true })

  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()
  const fechaInicioMes = `${anio}-${String(mes).padStart(2, '0')}-01`

  const [
    { data: resumenCuotas },
    { data: pagosDelMes },
    { data: gastosDelMes },
    { data: ultimosPagos },
  ] = await Promise.all([
    supabase.from('cuotas').select('estado, total_debido, condominio_id').eq('mes', mes).eq('anio', anio),
    supabase.from('pagos').select('monto').gte('fecha_pago', fechaInicioMes),
    supabase.from('gastos').select('monto').gte('fecha', fechaInicioMes),
    supabase.from('pagos').select('monto, fecha_pago, unidades(codigo, condominios(nombre))').order('created_at', { ascending: false }).limit(5),
  ])

  const statsPorCondo = (condominios ?? []).reduce((acc, c) => {
    const cuotasCondo = resumenCuotas?.filter(q => q.condominio_id === c.id) ?? []
    const total = cuotasCondo.length
    const pag = cuotasCondo.filter(q => q.estado === 'pagado').length
    const mor = cuotasCondo.filter(q => q.estado === 'moroso').length
    acc[c.id] = { total, pagadas: pag, morosas: mor, pct: total > 0 ? Math.round((pag / total) * 100) : null }
    return acc
  }, {} as Record<string, { total: number; pagadas: number; morosas: number; pct: number | null }>)

  const totalCuotas = resumenCuotas?.length ?? 0
  const pagadas = resumenCuotas?.filter(c => c.estado === 'pagado').length ?? 0
  const morosas = resumenCuotas?.filter(c => c.estado === 'moroso').length ?? 0
  const pendientes = totalCuotas - pagadas - morosas
  const recaudado = pagosDelMes?.reduce((s, p) => s + p.monto, 0) ?? 0
  const gastosMes = gastosDelMes?.reduce((s, g) => s + g.monto, 0) ?? 0
  const saldo = recaudado - gastosMes
  const pctCobro = totalCuotas > 0 ? Math.round((pagadas / totalCuotas) * 100) : 0

  const mesLabel = hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {admin?.nombre?.split(' ')[0] ?? 'Administrador'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/condominios/nuevo"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nuevo condominio
        </Link>
      </div>

      {/* Alert: morosas */}
      {morosas > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">
            {morosas} unidad{morosas !== 1 ? 'es' : ''} en mora este mes
          </p>
          <Link href="/condominios" className="text-xs text-red-600 font-semibold hover:underline">
            Ver condominios
          </Link>
        </div>
      )}

      {/* KPI row */}
      {totalCuotas > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Recaudado en el mes" value={formatCurrency(recaudado)} subvalue={mesLabel} color="green" />
          <StatCard label="Gastos en el mes" value={formatCurrency(gastosMes)} subvalue={mesLabel} color="red" />
          <StatCard label="Saldo neto" value={formatCurrency(saldo)} subvalue={mesLabel} color={saldo >= 0 ? 'blue' : 'yellow'} />
          <StatCard label="% Cobro global" value={`${pctCobro}%`} subvalue={`${pagadas}/${totalCuotas} cuotas`} color={pctCobro >= 80 ? 'green' : pctCobro >= 50 ? 'yellow' : 'red'} />
        </div>
      )}

      {/* Progreso de cobro global */}
      {totalCuotas > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Progreso de cobro — {mesLabel}</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-green-600 font-medium">{pagadas} pagadas</span>
              {pendientes > 0 && <span className="text-yellow-600 font-medium">{pendientes} pendientes</span>}
              {morosas > 0 && <span className="text-red-600 font-medium">{morosas} morosas</span>}
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${totalCuotas > 0 ? (pagadas / totalCuotas) * 100 : 0}%` }} />
            <div className="bg-yellow-400 h-full transition-all" style={{ width: `${totalCuotas > 0 ? (pendientes / totalCuotas) * 100 : 0}%` }} />
            <div className="bg-red-400 h-full transition-all" style={{ width: `${totalCuotas > 0 ? (morosas / totalCuotas) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Condominios — 2/3 width */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Mis Condominios</h2>
            <Link href="/condominios/nuevo" className="text-sm text-blue-600 font-medium hover:underline sm:hidden">
              + Agregar
            </Link>
          </div>

          {!condominios || condominios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-400 text-sm mb-3">No tienes condominios registrados</p>
              <Link
                href="/condominios/nuevo"
                className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Crear primer condominio
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {condominios.map(c => {
                const stats = statsPorCondo[c.id]
                return (
                  <Link
                    key={c.id}
                    href={`/condominios/${c.id}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-gray-900 truncate">{c.nombre}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {stats?.pct !== null && (
                            <span className={`text-sm font-bold ${stats.pct === 100 ? 'text-green-600' : stats.pct >= 70 ? 'text-blue-600' : 'text-red-500'}`}>
                              {stats.pct}%
                            </span>
                          )}
                          {stats && stats.morosas > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                              {stats.morosas} mora
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {stats && stats.total > 0 ? (
                          <>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                              <div className="bg-green-500 h-full" style={{ width: `${(stats.pagadas / stats.total) * 100}%` }} />
                              {stats.morosas > 0 && <div className="bg-red-400 h-full" style={{ width: `${(stats.morosas / stats.total) * 100}%` }} />}
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{stats.pagadas}/{stats.total}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 capitalize">{c.tipo.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Actividad reciente — 1/3 width */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Actividad reciente</h2>
          <div className="bg-white rounded-2xl border border-gray-100">
            {!ultimosPagos || ultimosPagos.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Sin pagos registrados</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {ultimosPagos.map((p, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const unidad = p.unidades as any
                  const codigoUnidad = unidad?.codigo ?? '–'
                  const condoNombre = unidad?.condominios?.nombre ?? ''
                  return (
                    <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">Unidad {codigoUnidad}</p>
                        {condoNombre && <p className="text-xs text-gray-400 truncate">{condoNombre}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-green-600">{formatCurrency(p.monto)}</p>
                        <p className="text-xs text-gray-400">{new Date(p.fecha_pago).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {(ultimosPagos?.length ?? 0) > 0 && (
              <div className="px-4 py-3 border-t border-gray-50">
                <Link href="/condominios" className="text-xs text-blue-600 font-medium hover:underline">
                  Ver todos los condominios →
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
