export default function SuspendidoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta suspendida</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu cuenta ha sido suspendida. Para reactivarla, contáctanos por WhatsApp.
        </p>
        <a
          href="https://wa.me/18001234567"
          className="block w-full bg-green-500 text-white py-3 rounded-xl font-medium text-sm mb-3 hover:bg-green-600 transition-colors"
        >
          Contactar soporte
        </a>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
