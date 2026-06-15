import { createAdminClient } from '@/lib/supabase/admin'

export default async function WhatsAppLogPage() {
  const supabase = createAdminClient()

  const { data: conversaciones } = await supabase
    .from('whatsapp_conversaciones')
    .select('*, admins(nombre)')
    .order('ultimo_mensaje', { ascending: false, nullsFirst: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Conversaciones WhatsApp</h1>
        <span className="text-sm text-gray-400">{conversaciones?.length ?? 0} activas</span>
      </div>

      <div className="space-y-2">
        {(conversaciones ?? []).map(conv => {
          const admin = (conv.admins as unknown) as { nombre: string } | null
          const TIPO_COLORS: Record<string, string> = {
            admin: 'bg-blue-100 text-blue-700',
            residente: 'bg-green-100 text-green-700',
            desconocido: 'bg-gray-100 text-gray-500',
          }
          const tipoColor = TIPO_COLORS[conv.tipo_usuario ?? 'desconocido'] ?? 'bg-gray-100 text-gray-500'

          return (
            <div key={conv.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 font-mono">{conv.telefono}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor}`}>
                    {conv.tipo_usuario ?? 'desconocido'}
                  </span>
                </div>
                {admin && <p className="text-xs text-gray-400 mt-0.5">Admin: {admin.nombre}</p>}
              </div>
              <p className="text-xs text-gray-300">
                {conv.ultimo_mensaje
                  ? new Date(conv.ultimo_mensaje).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
          )
        })}
        {(!conversaciones || conversaciones.length === 0) && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin conversaciones aún</div>
        )}
      </div>
    </div>
  )
}
