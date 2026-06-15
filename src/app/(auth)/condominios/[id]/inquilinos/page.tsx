'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Inquilino {
  id: string
  nombre: string
  cedula: string | null
  telefono: string | null
  email: string | null
  unidad_id: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  unidades: { codigo: string }
}

interface Unidad {
  id: string
  codigo: string
}

const FORM_VACIO = { nombre: '', cedula: '', telefono: '', email: '', unidad_id: '', fecha_inicio: '', fecha_fin: '' }

export default function InquilinosPage() {
  const { id } = useParams<{ id: string }>()
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const [resInq, resUnid] = await Promise.all([
      fetch(`/api/condominios/${id}/inquilinos`),
      fetch(`/api/condominios/${id}/unidades`),
    ])
    const dataInq = await resInq.json()
    const dataUnid = await resUnid.json()
    setInquilinos(dataInq.inquilinos ?? [])
    setUnidades(dataUnid.unidades ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id])

  function abrirEditar(inq: Inquilino) {
    setEditId(inq.id)
    setForm({
      nombre: inq.nombre,
      cedula: inq.cedula ?? '',
      telefono: inq.telefono ?? '',
      email: inq.email ?? '',
      unidad_id: inq.unidad_id ?? '',
      fecha_inicio: inq.fecha_inicio ?? '',
      fecha_fin: inq.fecha_fin ?? '',
    })
    setModal('editar')
    setError(null)
  }

  function cerrarModal() {
    setModal(null)
    setEditId(null)
    setForm(FORM_VACIO)
    setError(null)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const isEdit = modal === 'editar'
    const res = await fetch(`/api/condominios/${id}/inquilinos`, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: editId, ...form } : form),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    cerrarModal()
    cargar()
  }

  async function eliminar(inqId: string) {
    if (!confirm('¿Eliminar este inquilino?')) return
    await fetch(`/api/condominios/${id}/inquilinos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inqId }),
    })
    cargar()
  }

  const CAMPOS_BASE = [
    { name: 'nombre', label: 'Nombre *', placeholder: 'Pedro Martínez', required: true },
    { name: 'cedula', label: 'Cédula', placeholder: '001-1234567-8', required: false },
    { name: 'telefono', label: 'WhatsApp', placeholder: '809-555-1234', required: false },
    { name: 'email', label: 'Email', placeholder: 'pedro@email.com', required: false },
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Inquilinos</h1>
        </div>
        <button onClick={() => { setModal('nuevo'); setError(null) }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : inquilinos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay inquilinos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Los inquilinos son arrendatarios, distintos a propietarios</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquilinos.map(inq => {
            const activo = !inq.fecha_fin || new Date(inq.fecha_fin) >= new Date()
            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-semibold text-sm shrink-0">
                    {inq.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{inq.nombre}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {[
                        inq.unidades?.codigo ? `Unidad ${inq.unidades.codigo}` : null,
                        inq.telefono,
                        inq.fecha_inicio ? `Desde ${new Date(inq.fecha_inicio).toLocaleDateString('es-DO')}` : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => abrirEditar(inq)} className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1">
                    Editar
                  </button>
                  <button onClick={() => eliminar(inq.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg">
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modal === 'nuevo' ? 'Nuevo inquilino' : 'Editar inquilino'}
            </h2>
            <form onSubmit={enviar} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              {CAMPOS_BASE.map(f => (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha inicio</label>
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha fin</label>
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardando ? 'Guardando...' : modal === 'nuevo' ? 'Agregar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
