import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== SUPER_ADMIN_EMAIL) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">CondoHub Admin</span>
          <nav className="flex gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white text-xs transition-colors">Dashboard</Link>
            <Link href="/admin/clientes" className="text-gray-400 hover:text-white text-xs transition-colors">Clientes</Link>
            <Link href="/admin/whatsapp" className="text-gray-400 hover:text-white text-xs transition-colors">WhatsApp</Link>
            <Link href="/admin/facturacion" className="text-gray-400 hover:text-white text-xs transition-colors">Facturación</Link>
          </nav>
        </div>
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs">‹ Salir</Link>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
