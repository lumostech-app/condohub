import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            CondoHub
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/precios" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block">
              Precios
            </Link>
            <Link href="/login" className="text-sm text-gray-600 font-medium">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400">
          © 2026 CondoHub · República Dominicana · Hecho para síndicos que valoran su tiempo
        </div>
      </footer>
    </div>
  )
}
