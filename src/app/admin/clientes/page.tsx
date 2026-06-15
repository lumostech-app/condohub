'use client'

import { useEffect, useState } from 'react'

interface AdminCliente {
  id: string
  nombre: string
  email: string
  telefono: string | null
  plan: string
  plan_status: string
  trial_ends_at: string | null
  plan_paid_until: string | null
  created_at: string
}

const ESTADO_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const PLANES = ['mini', 'basico', 'starter', 'pro', 'business']

export default function ClientesPage() {
  const [admins, setAdmins] = useState<AdminCliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  async function cargar() {
    const res = await fetch('/api/admin/clientes')
    const data = await res.json()
    setAdmins(data.admins ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function ejecutarAccion(id: string, accion: string, extra?: Record<string, string>) {
    setProcesando(id + accion)
    const res = await fetch(`/api/admin/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, ...extra }),
    })
    setProcesando(null)
    if (res.ok) cargar()
    else {
      const data = await res.json()
      alert(data.error ?? 'Error al ejecutar acción')
    }
  }

  async function cambiarPlan(id: string) {
    const plan = prompt('Nuevo plan (mini, basico, starter, pro, business):')?.toLowerCase().trim()
    if (!plan || !PLANES.includes(plan)) { alert('Plan inválido'); return }
    await ejecutarAccion(id, 'cambiar_plan', { plan })
  }

  if (cargando) {
    return <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <span className="text-sm text-gray-400">{admins.length} registrados</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nombre', 'Email', 'Plan', 'Estado', 'Vencimiento', 'Registro', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map(admin => {
                const vencimiento = admin.plan_status === 'trial'
                  ? admin.trial_ends_at
                  : admin.plan_paid_until

                return (
                  <tr key={admin.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {admin.nombre}
                      {admin.telefono && <div className="text-xs text-gray-400">{admin.telefono}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{admin.email}</td>
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
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {vencimiento ? new Date(vencimiento).toLocaleDateString('es-DO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(admin.created_at).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {admin.plan_status !== 'active' && (
                          <button
                            onClick={() => ejecutarAccion(admin.id, 'activar')}
                            disabled={!!procesando}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            Activar
                          </button>
                        )}
                        {admin.plan_status !== 'suspended' && (
                          <button
                            onClick={() => ejecutarAccion(admin.id, 'suspender')}
                            disabled={!!procesando}
                            className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            Suspender
                          </button>
                        )}
                        {admin.plan_status !== 'trial' && (
                          <button
                            onClick={() => ejecutarAccion(admin.id, 'extender_trial')}
                            disabled={!!procesando}
                            className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            +14d trial
                          </button>
                        )}
                        <button
                          onClick={() => cambiarPlan(admin.id)}
                          disabled={!!procesando}
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {admins.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No hay clientes aún</div>
        )}
      </div>
    </div>
  )
}
