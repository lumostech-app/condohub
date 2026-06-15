import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

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
  ] = await Promise.all([
    supabase.from('cuotas').select('estado, total_debido, condominio_id').eq('mes', mes).eq('anio', anio),
    supabase.from('pagos').select('monto').gte('fecha_pago', fechaInicioMes),
    supabase.from('gastos').select('monto').gte('fecha', fechaInicioMes),
  ])

  // Stats por condominio
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {admin?.nombre?.split(' ')[0] ?? 'Administrador'} 👋
          </h1>
          <p className="text-sm text-gray-500">
            {hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Financiero del mes */}
        {totalCuotas > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
            </h2>

            {/* Ingresos / Gastos / Saldo */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400">Recaudado</p>
                <p className="text-lg font-bold text-green-600 mt-0.5">{formatCurrency(recaudado)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400">Gastos</p>
                <p className="text-lg font-bold text-red-500 mt-0.5">{formatCurrency(gastosMes)}</p>
              </div>
              <div className={`rounded-2xl p-4 border ${saldo >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <p className="text-xs text-gray-400">Saldo</p>
                <p className={`text-lg font-bold mt-0.5 ${saldo >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{formatCurrency(saldo)}</p>
              </div>
            </div>

            {/* Progreso de cobro */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Progreso de cobro</p>
                <p className="text-xs font-bold text-gray-700">{pagadas}/{totalCuotas} · {pctCobro}%</p>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pctCobro}%` }} />
              </div>
              <div className="flex gap-4 mt-3">
                <span className="text-xs text-green-600 font-medium">{pagadas} pagadas</span>
                {pendientes > 0 && <span className="text-xs text-yellow-600 font-medium">{pendientes} pendientes</span>}
                {morosas > 0 && <span className="text-xs text-red-600 font-medium">{morosas} morosas</span>}
              </div>
            </div>
          </section>
        )}

        {/* Condominios */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Mis Condominios
            </h2>
            <Link href="/condominios/nuevo" className="text-sm text-blue-600 font-medium">
              + Agregar
            </Link>
          </div>

          {!condominios || condominios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No tienes condominios aún</p>
              <Link
                href="/condominios/nuevo"
                className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
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
                    className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{c.nombre}</p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">{c.tipo.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        {stats?.pct !== null ? (
                          <p className={`text-sm font-bold ${stats.pct === 100 ? 'text-green-600' : stats.pct >= 70 ? 'text-blue-600' : 'text-red-500'}`}>
                            {stats.pct}%
                          </p>
                        ) : (
                          <span className="text-gray-300">›</span>
                        )}
                        {stats && stats.total > 0 && (
                          <p className="text-xs text-gray-400">{stats.pagadas}/{stats.total}</p>
                        )}
                      </div>
                    </div>
                    {stats && stats.total > 0 && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-green-500 h-full" style={{ width: `${(stats.pagadas / stats.total) * 100}%` }} />
                        {stats.morosas > 0 && <div className="bg-red-400 h-full" style={{ width: `${(stats.morosas / stats.total) * 100}%` }} />}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
