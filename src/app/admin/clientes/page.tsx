import { createAdminClient } from '@/lib/supabase/admin'

const ESTADO_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default async function ClientesPage() {
  const supabase = createAdminClient()

  const { data: admins } = await supabase
    .from('admins')
    .select('*, condominios(count), unidades(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <span className="text-sm text-gray-400">{admins?.length ?? 0} registrados</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nombre', 'Email', 'WhatsApp', 'Plan', 'Estado', 'Registro'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(admins ?? []).map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{admin.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{admin.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{admin.telefono}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-lg capitalize">
                      {admin.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${ESTADO_COLOR[admin.plan_status] ?? ''}`}>
                      {admin.plan_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(admin.created_at).toLocaleDateString('es-DO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!admins || admins.length === 0) && (
          <div className="text-center py-12 text-gray-400 text-sm">No hay clientes aún</div>
        )}
      </div>
    </div>
  )
}
