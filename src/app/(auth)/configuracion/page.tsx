import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITES } from '@/types'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .single()

  const plan = admin?.plan as keyof typeof PLAN_LIMITES
  const limites = plan ? PLAN_LIMITES[plan] : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Mi cuenta</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Nombre</p>
          <p className="text-gray-900 mt-1">{admin?.nombre}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Email</p>
          <p className="text-gray-900 mt-1">{admin?.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">WhatsApp</p>
          <p className="text-gray-900 mt-1">{admin?.telefono}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase font-semibold">Plan actual</p>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
            {admin?.plan}
          </span>
        </div>
        {limites && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Condominios</p>
              <p className="font-semibold text-gray-900">Hasta {limites.condominios}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Unidades</p>
              <p className="font-semibold text-gray-900">Hasta {limites.unidades}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Estado: <span className="capitalize font-medium text-gray-600">{admin?.plan_status}</span>
          {admin?.trial_ends_at && admin?.plan_status === 'trial' && (
            <> · Trial hasta {new Date(admin.trial_ends_at).toLocaleDateString('es-DO')}</>
          )}
        </p>
      </div>

      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}
