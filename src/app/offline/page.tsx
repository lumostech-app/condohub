export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">📡</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Sin conexión</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        No hay conexión a internet. Revisa tu red y vuelve a intentarlo.
      </p>
    </div>
  )
}
