import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

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
    { count: totalInquilinos },
    { data: cuotasMes },
    { data: configCuota },
    { data: gastosMes },
  ] = await Promise.all([
    supabase.from('unidades').select('*', { count: 'exact', head: true }).eq('condominio_id', params.id),
    supabase.from('propietarios').select('*', { count: 'exact', head: true }).eq('unidad_id', params.id),
    supabase.from('inquilinos').select('*', { count: 'exact', head: true }).eq('unidad_id', params.id),
    supabase.from('cuotas').select('estado, total_debido').eq('condominio_id', params.id).eq('mes', mes).eq('anio', anio),
    supabase.from('config_cuotas').select('monto_base').eq('condominio_id', params.id).single(),
    supabase.from('gastos').select('monto').eq('condominio_id', params.id).gte('fecha', `${anio}-${String(mes).padStart(2, '0')}-01`),
  ])

  const pagadas = cuotasMes?.filter(c => c.estado === 'pagado').length ?? 0
  const morosas = cuotasMes?.filter(c => c.estado === 'moroso').length ?? 0
  const pendientes = (cuotasMes?.length ?? 0) - pagadas - morosas
  const ingresosMes = cuotasMes?.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.total_debido, 0) ?? 0
  const gastosTotalMes = gastosMes?.reduce((s, g) => s + g.monto, 0) ?? 0

  const secciones = [
    { href: `/condominios/${params.id}/unidades`,      icon: '🏠', label: 'Unidades',      desc: `${totalUnidades ?? 0} registradas` },
    { href: `/condominios/${params.id}/propietarios`,  icon: '👤', label: 'Propietarios',  desc: `${totalPropietarios ?? 0} registrados` },
    { href: `/condominios/${params.id}/inquilinos`,    icon: '🔑', label: 'Inquilinos',    desc: `${totalInquilinos ?? 0} registrados` },
    { href: `/condominios/${params.id}/cuotas`,        icon: '💰', label: 'Cuotas',        desc: `${pagadas} pagadas · ${morosas} morosas` },
    { href: `/condominios/${params.id}/gastos`,        icon: '📋', label: 'Gastos',        desc: 'Proveedores y empleados' },
    { href: `/condominios/${params.id}/reportes`,      icon: '📊', label: 'Reporte',       desc: 'Resumen del mes' },
    { href: `/condominios/${params.id}/configuracion`, icon: '⚙️', label: 'Configuración', desc: configCuota?.monto_base ? `RD$${configCuota.monto_base.toLocaleString()}/mes` : 'Sin configurar' },
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/condominios" className="text-sm text-gray-400 hover:text-gray-600">
            ‹ Mis condominios
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{condominio.nombre}</h1>
          {condominio.direccion && (
            <p className="text-sm text-gray-400 mt-0.5">{condominio.direccion}</p>
          )}
        </div>
        <Link
          href={`/condominios/${params.id}/editar`}
          className="text-xs text-blue-600 font-medium mt-2 px-3 py-1.5 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Editar
        </Link>
      </div>

      {/* Balance del mes */}
      {(cuotasMes?.length ?? 0) > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-400">Ingresos</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(ingresosMes)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Gastos</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(gastosTotalMes)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">{pagadas}</p>
              <p className="text-xs text-gray-500">Pagadas</p>
            </div>
            <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-yellow-500">{pendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-500">{morosas}</p>
              <p className="text-xs text-gray-500">Morosas</p>
            </div>
          </div>
        </section>
      )}

      {/* Cuota no configurada */}
      {!configCuota?.monto_base && (
        <Link href={`/condominios/${params.id}/configuracion`} className="block bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 hover:bg-amber-100 transition-colors">
          <p className="text-sm font-medium text-amber-800">⚠️ Cuota no configurada</p>
          <p className="text-xs text-amber-600 mt-1">
            Toca aquí para configurar el monto y el sistema generará cuotas automáticamente.
          </p>
        </Link>
      )}

      {/* Secciones */}
      <div className="space-y-2">
        {secciones.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 transition-colors"
          >
            <span className="text-2xl">{s.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
