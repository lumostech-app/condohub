import Link from 'next/link'

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
      <div className="max-w-sm w-full mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="text-5xl">📧</div>
          <h1 className="text-xl font-bold text-gray-900">Verifica tu email</h1>
          <p className="text-sm text-gray-500">
            Te enviamos un enlace de confirmación. Haz clic en el enlace del correo para activar tu cuenta y comenzar tu período de prueba.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              ¿No llegó el correo? Revisa tu carpeta de spam o correo no deseado.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya verificaste?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
