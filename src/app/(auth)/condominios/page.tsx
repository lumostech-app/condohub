import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CondominiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: condominios } = await supabase
    .from('condominios')
    .select('*, edificios(count), unidades(count)')
    .order('created_at', { ascending: true })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Condominios</h1>
        <Link
          href="/condominios/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nuevo
        </Link>
      </div>

      {!condominios || condominios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">No tienes condominios registrados</p>
          <Link
            href="/condominios/nuevo"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium"
          >
            Crear primer condominio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {condominios.map((c) => (
            <Link
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
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
