import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .single()

  const { data: condominios } = await supabase
    .from('condominios')
    .select('id, nombre, tipo')
    .order('created_at', { ascending: true })

  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  const { data: resumenCuotas } = await supabase
    .from('cuotas')
    .select('estado')
    .eq('mes', mes)
    .eq('anio', anio)

  const totalCuotas = resumenCuotas?.length ?? 0
  const pagadas = resumenCuotas?.filter(c => c.estado === 'pagado').length ?? 0
  const morosas = resumenCuotas?.filter(c => c.estado === 'moroso').length ?? 0
  const pendientes = totalCuotas - pagadas - morosas

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {admin?.nombre?.split(' ')[0] ?? 'Administrador'}
          </h1>
          <p className="text-sm text-gray-500">
            {hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Resumen del mes */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Cuotas — {hoy.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">{pagadas}</p>
              <p className="text-xs text-gray-500 mt-1">Pagadas</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-yellow-500">{pendientes}</p>
              <p className="text-xs text-gray-500 mt-1">Pendientes</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-red-500">{morosas}</p>
              <p className="text-xs text-gray-500 mt-1">Morosas</p>
            </div>
          </div>
        </section>

        {/* Condominios */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Mis Condominios
            </h2>
            <a
              href="/condominios/nuevo"
              className="text-sm text-blue-600 font-medium"
            >
              + Agregar
            </a>
          </div>

          {!condominios || condominios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No tienes condominios aún</p>
              <a
                href="/condominios/nuevo"
                className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Crear primer condominio
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {condominios.map(c => (
                <a
                  key={c.id}
                  href={`/condominios/${c.id}`}
                  className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {c.tipo.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-gray-300">›</span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
