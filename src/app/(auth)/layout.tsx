import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ShellWrapper from '@/components/shell/ShellWrapper'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: admin }, { data: condominios }] = await Promise.all([
    supabase.from('admins').select('nombre, plan, plan_status, trial_ends_at').single(),
    supabase.from('condominios').select('id, nombre').order('created_at', { ascending: true }),
  ])

  if (admin?.plan_status === 'suspended') redirect('/suspendido')

  let diasRestantes: number | null = null
  if (admin?.plan_status === 'trial' && admin?.trial_ends_at) {
    const diff = new Date(admin.trial_ends_at).getTime() - Date.now()
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ShellWrapper
        adminNombre={admin?.nombre ?? 'Administrador'}
        plan={admin?.plan ?? 'gratis'}
        condominios={condominios ?? []}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Trial banner */}
        {admin?.plan_status === 'trial' && diasRestantes !== null && (
          <Link
            href="/suscripcion"
            className={`block text-center text-xs py-2 px-4 font-medium hover:opacity-90 transition-opacity ${
              diasRestantes <= 3 ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
            }`}
          >
            {diasRestantes === 0
              ? '⚠️ Tu período de prueba vence hoy · Haz clic para activar tu plan'
              : `⏳ ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} de prueba restante${diasRestantes !== 1 ? 's' : ''} · Haz clic para suscribirte`}
          </Link>
        )}

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
