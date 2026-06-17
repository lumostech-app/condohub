import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'

export default async function CondominioDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: condominio } = await supabase
    .from('condominios')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!condominio) notFound()

  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  const [
    { count: totalUnidades },
    { count: totalPropietarios },
    { data: cuotasMes },
    { data: configCuota },
    { data: gastosMes },
    { data: ultimosPagos },
  ] = await Promise.all([
    supabase.from('unidades').select('*', { count: 'exact', head: true }).eq('condominio_id', params.id),
    supabase.from('propietarios').select('*, unidades!inner(condominio_id)', { count: 'exact', head: true }).eq('unidades.condominio_id', params.id),
    supabase.from('cuotas').select('estado, total_debido, unidades(codigo, propietarios(nombre))').eq('condominio_id', params.id).eq('mes', mes).eq('anio', anio),
    supabase.from('config_cuotas').select('monto_base').eq('condominio_id', params.id).single(),
    supabase.from('gastos').select('monto').eq('condominio_id', params.id).gte('fecha', `${anio}-${String(mes).padStart(2, '0')}-01`),
    supabase.from('pagos').select('monto, fecha_pago, unidades(codigo)').eq('condominio_id', params.id).order('created_at', { ascending: false }).limit(5),
  ])

  const pagadas = cuotasMes?.filter(c => c.estado === 'pagado').length ?? 0
  const morosas = cuotasMes?.filter(c => c.estado === 'moroso').length ?? 0
  const pendientes = (cuotasMes?.length ?? 0) - pagadas - morosas
  const total = cuotasMes?.length ?? 0
  const ingresosMes = cuotasMes?.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.total_debido, 0) ?? 0
  const gastosTotalMes = gastosMes?.reduce((s, g) => s + g.monto, 0) ?? 0
  const saldo = ingresosMes - gastosTotalMes
  const pct = total > 0 ? Math.round((pagadas / total) * 100) : null

  const morosasDetalle = cuotasMes?.filter(c => c.estado === 'moroso') ?? []
  const mesLabel = hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={condominio.nombre}
        subtitle={condominio.direccion ?? `${condominio.tipo.replace('_', ' ')} · ${totalUnidades ?? 0} unidades`}
        backHref="/condominios"
        backLabel="Mis condominios"
        action={
          <Link
            href={`/condominios/${params.id}/editar`}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Editar
          </Link>
        }
      />

      {/* Cuota no configurada */}
      {!configCuota?.monto_base && (
        <Link
          href={`/condominios/${params.id}/configuracion`}
          className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition-colors"
        >
          <p className="text-sm font-semibold text-amber-800">⚠️ Cuota mensual no configurada</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Configura el monto base para que el sistema genere cuotas automáticamente cada mes.
          </p>
        </Link>
      )}

      {/* KPIs del mes */}
      {total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Ingresos del mes" value={formatCurrency(ingresosMes)} subvalue={mesLabel} color="green" />
          <StatCard label="Gastos del mes" value={formatCurrency(gastosTotalMes)} subvalue={mesLabel} color="red" />
          <StatCard label="Saldo neto" value={formatCurrency(saldo)} subvalue={mesLabel} color={saldo >= 0 ? 'blue' : 'yellow'} />
          <StatCard
            label="% Cobro"
            value={pct !== null ? `${pct}%` : '–'}
            subvalue={`${pagadas}/${total} cuotas`}
            color={pct !== null && pct >= 80 ? 'green' : pct !== null && pct >= 50 ? 'yellow' : 'red'}
          />
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Estado de cuotas — {mesLabel}</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-green-600 font-medium">{pagadas} pagadas</span>
              {pendientes > 0 && <span className="text-yellow-600 font-medium">{pendientes} pendientes</span>}
              {morosas > 0 && <span className="text-red-600 font-medium">{morosas} morosas</span>}
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex mb-3">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${total > 0 ? (pagadas / total) * 100 : 0}%` }} />
            <div className="bg-yellow-400 h-full transition-all" style={{ width: `${total > 0 ? (pendientes / total) * 100 : 0}%` }} />
            <div className="bg-red-400 h-full transition-all" style={{ width: `${total > 0 ? (morosas / total) * 100 : 0}%` }} />
          </div>
          <Link
            href={`/condominios/${params.id}/cuotas`}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Ver todas las cuotas →
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Morosas */}
        {morosasDetalle.length > 0 && (
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Unidades en mora</h2>
              <Link href={`/condominios/${params.id}/cuotas`} className="text-sm text-red-600 font-medium hover:underline">
                Ver cuotas
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-red-700">Unidad</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-red-700">Propietario</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-red-700 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {morosasDetalle.slice(0, 8).map((c, i) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const unidad = c.unidades as any
                      const prop = Array.isArray(unidad?.propietarios) ? unidad.propietarios[0] : null
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{unidad?.codigo ?? '–'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{prop?.nombre ?? <span className="italic text-gray-300">Sin propietario</span>}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-600">{formatCurrency(c.total_debido)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Últimos pagos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Últimos pagos</h2>
            <Link href={`/condominios/${params.id}/pagos`} className="text-sm text-blue-600 font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100">
            {!ultimosPagos || ultimosPagos.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Sin pagos registrados</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {ultimosPagos.map((p, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const unidad = p.unidades as any
                  return (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Unidad {unidad?.codigo ?? '–'}</p>
                        <p className="text-xs text-gray-400">{new Date(p.fecha_pago).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(p.monto)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Accesos rápidos */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Acceso rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: `/condominios/${params.id}/cuotas`,       label: 'Cuotas',        badge: total > 0 ? `${morosas} mora` : null, badgeColor: 'red' },
              { href: `/condominios/${params.id}/pagos`,        label: 'Pagos',         badge: null, badgeColor: '' },
              { href: `/condominios/${params.id}/gastos`,       label: 'Gastos',        badge: null, badgeColor: '' },
              { href: `/condominios/${params.id}/unidades`,     label: 'Unidades',      badge: `${totalUnidades ?? 0}`, badgeColor: 'blue' },
              { href: `/condominios/${params.id}/propietarios`, label: 'Propietarios',  badge: `${totalPropietarios ?? 0}`, badgeColor: 'blue' },
              { href: `/condominios/${params.id}/reportes`,     label: 'Reporte',       badge: null, badgeColor: '' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                {item.badge && morosas > 0 && item.badgeColor === 'red' ? (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{item.badge}</span>
                ) : item.badge && item.badgeColor === 'blue' ? (
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{item.badge}</span>
                ) : (
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
