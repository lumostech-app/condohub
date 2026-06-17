import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_LIMITES } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Admin {
  id: string
  nombre: string
  email: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  created_at: string
}

const PLAN_ORDER = ['basico', 'plus'] as const

export default async function FacturacionPage() {
  const supabase = createAdminClient()

  const { data: admins } = await supabase
    .from('admins')
    .select('id, nombre, email, plan, plan_status, trial_ends_at, created_at')
    .eq('plan_status', 'active')
    .order('created_at', { ascending: true }) as { data: Admin[] | null }

  const activos = admins ?? []

  // Ingresos mensuales por plan
  const ingresosPorPlan = PLAN_ORDER.reduce((acc, plan) => {
    const count = activos.filter(a => a.plan === plan).length
    const precio = PLAN_LIMITES[plan]?.precio ?? 0
    acc[plan] = { count, total: count * precio }
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  const mrr = Object.values(ingresosPorPlan).reduce((s, v) => s + v.total, 0)

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-gray-500 text-sm mt-1">Ingresos recurrentes mensuales (MRR)</p>
      </div>

      {/* MRR total */}
      <div className="bg-blue-600 text-white rounded-2xl p-6 mb-6">
        <p className="text-sm opacity-80 mb-1">MRR total (clientes activos)</p>
        <p className="text-4xl font-bold">{formatCurrency(mrr)}</p>
        <p className="text-sm opacity-70 mt-2">{activos.length} clientes activos</p>
      </div>

      {/* Desglose por plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Desglose por plan</h2>
        <div className="space-y-3">
          {PLAN_ORDER.map(plan => {
            const { count, total } = ingresosPorPlan[plan] ?? { count: 0, total: 0 }
            const precio = PLAN_LIMITES[plan]?.precio ?? 0
            return (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="capitalize text-sm font-medium text-gray-900 w-20">{plan}</span>
                  <span className="text-xs text-gray-400">{count} × {formatCurrency(precio)}/mes</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{formatCurrency(total)}</span>
              </div>
            )
          })}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total MRR</span>
            <span className="text-sm font-bold text-blue-600">{formatCurrency(mrr)}</span>
          </div>
        </div>
      </div>

      {/* Lista de clientes activos */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Clientes activos</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {activos.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Sin clientes activos</div>
          ) : activos.map(a => (
            <div key={a.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                <p className="text-xs text-gray-400">{a.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.plan_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {a.plan_status}
                </span>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700 capitalize">{a.plan}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(PLAN_LIMITES[a.plan as keyof typeof PLAN_LIMITES]?.precio ?? 0)}/mes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
