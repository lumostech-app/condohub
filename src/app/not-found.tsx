import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <p className="text-6xl mb-4">🏢</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 text-sm mb-6">Esta página no existe o fue movida.</p>
      <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium">
        Ir al inicio
      </Link>
    </div>
  )
}
