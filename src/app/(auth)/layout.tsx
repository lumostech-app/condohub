import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('nombre, plan, plan_status, trial_ends_at')
    .single()

  if (admin?.plan_status === 'suspended') redirect('/suspendido')

  let diasRestantes: number | null = null
  if (admin?.plan_status === 'trial' && admin?.trial_ends_at) {
    const diff = new Date(admin.trial_ends_at).getTime() - Date.now()
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de trial */}
      {admin?.plan_status === 'trial' && diasRestantes !== null && (
        <div className={`text-center text-xs py-2 px-4 font-medium ${diasRestantes <= 3 ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
          {diasRestantes === 0
            ? '⚠️ Tu período de prueba vence hoy. Contáctanos para continuar.'
            : `⏳ Período de prueba: ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* Barra de navegación móvil inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-2xl mx-auto flex justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Inicio</span>
          </Link>
          <Link href="/condominios" className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs">Condominios</span>
          </Link>
          <Link href="/configuracion" className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Contenido con padding para barra inferior */}
      <div className="pb-20">
        {children}
      </div>
    </div>
  )
}
