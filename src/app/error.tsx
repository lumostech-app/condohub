'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CondoHub Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
        Ocurrió un error inesperado. Por favor intenta de nuevo.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
