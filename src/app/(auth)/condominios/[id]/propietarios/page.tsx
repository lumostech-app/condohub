'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Propietario {
  id: string
  nombre: string
  cedula: string | null
  telefono: string | null
  email: string | null
  unidad_id: string | null
  unidades: { codigo: string }
}

interface Unidad {
  id: string
  codigo: string
}

export default function PropietariosPage() {
  const { id } = useParams<{ id: string }>()
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', email: '', unidad_id: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const [resProp, resUnid] = await Promise.all([
      fetch(`/api/condominios/${id}/propietarios`),
      fetch(`/api/condominios/${id}/unidades`),
    ])
    const dataProp = await resProp.json()
    const dataUnid = await resUnid.json()
    setPropietarios(dataProp.propietarios ?? [])
    setUnidades(dataUnid.unidades ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}/propietarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    setModal(false)
    setForm({ nombre: '', cedula: '', telefono: '', email: '', unidad_id: '' })
    cargar()
  }

  async function eliminar(propId: string) {
    if (!confirm('¿Eliminar este propietario?')) return
    await fetch(`/api/condominios/${id}/propietarios`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: propId }),
    })
    cargar()
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Propietarios</h1>
        </div>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : propietarios.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay propietarios registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {propietarios.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0">
                  {p.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {[
                      p.unidades?.codigo ? `Unidad ${p.unidades.codigo}` : null,
                      p.telefono,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <button onClick={() => eliminar(p.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo propietario</h2>
            <form onSubmit={agregar} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              {[
                { name: 'nombre', label: 'Nombre *', placeholder: 'María González', required: true },
                { name: 'cedula', label: 'Cédula', placeholder: '001-1234567-8', required: false },
                { name: 'telefono', label: 'WhatsApp', placeholder: '809-555-1234', required: false },
                { name: 'email', label: 'Email', placeholder: 'maria@email.com', required: false },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    required={f.required}
                    value={form[f.name as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-gray-700">Unidad</label>
                <select
                  value={form.unidad_id}
                  onChange={e => setForm(p => ({ ...p, unidad_id: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.codigo}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
