import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'

export default async function SuperAdminPage() {
  const supabase = createAdminClient()

  const [
    { count: totalAdmins },
    { count: activos },
    { count: trials },
    { count: suspendidos },
    { count: totalCondominios },
    { count: totalUnidades },
    { data: planDistrib },
    { data: conversaciones },
  ] = await Promise.all([
    supabase.from('admins').select('*', { count: 'exact', head: true }),
    supabase.from('admins').select('*', { count: 'exact', head: true }).eq('plan_status', 'active'),
    supabase.from('admins').select('*', { count: 'exact', head: true }).eq('plan_status', 'trial'),
    supabase.from('admins').select('*', { count: 'exact', head: true }).eq('plan_status', 'suspended'),
    supabase.from('condominios').select('*', { count: 'exact', head: true }),
    supabase.from('unidades').select('*', { count: 'exact', head: true }),
    supabase.from('admins').select('plan').in('plan_status', ['active', 'trial']),
    supabase.from('whatsapp_conversaciones').select('tipo_usuario').eq('tipo_usuario', 'admin'),
  ])

  // Ingresos mensuales estimados (MRR)
  const PRECIOS: Record<string, number> = { mini: 990, basico: 1490, starter: 2500, pro: 4500, business: 7500 }
  const mrr = (planDistrib ?? [])
    .filter((a: { plan: string }) => (a as { plan: string }).plan)
    .reduce((sum: number, a: { plan: string }) => sum + (PRECIOS[(a as { plan: string }).plan] ?? 0), 0)

  const planCount: Record<string, number> = {}
  for (const a of planDistrib ?? []) {
    const plan = (a as { plan: string }).plan
    planCount[plan] = (planCount[plan] ?? 0) + 1
  }

  const metricas = [
    { label: 'Clientes activos', value: activos ?? 0, color: 'text-green-600' },
    { label: 'En trial', value: trials ?? 0, color: 'text-yellow-500' },
    { label: 'Suspendidos', value: suspendidos ?? 0, color: 'text-red-500' },
    { label: 'Total registros', value: totalAdmins ?? 0, color: 'text-gray-700' },
    { label: 'Condominios', value: totalCondominios ?? 0, color: 'text-blue-600' },
    { label: 'Unidades', value: totalUnidades ?? 0, color: 'text-blue-600' },
    { label: 'Admins en WhatsApp', value: conversaciones?.length ?? 0, color: 'text-green-600' },
    { label: 'MRR estimado', value: formatCurrency(mrr), color: 'text-green-700', isString: true },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Panel super admin</h1>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {metricas.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-gray-400 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Distribución de planes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Distribución por plan</h2>
        <div className="space-y-2">
          {['mini', 'basico', 'starter', 'pro', 'business'].map(plan => {
            const count = planCount[plan] ?? 0
            const total = (activos ?? 0) + (trials ?? 0)
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={plan} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-16 capitalize">{plan}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
