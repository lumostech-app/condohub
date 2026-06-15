import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Administra tu condominio<br />desde WhatsApp
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          CondoHub digitaliza la operación diaria de condominios en República Dominicana.
          Sin formularios. Sin hojas de cálculo. Solo WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Comenzar gratis — 14 días
          </Link>
          <Link
            href="/precios"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    </main>
  )
}
