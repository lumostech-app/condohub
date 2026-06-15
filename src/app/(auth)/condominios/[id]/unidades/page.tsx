'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Unidad {
  id: string
  codigo: string
  tipo: string
  piso: number | null
  parqueos: number
  propietarios: { nombre: string; telefono: string | null }[]
  edificios: { nombre: string } | null
}

const FORM_VACIO = { codigo: '', tipo: 'apartamento', piso: '', parqueos: '0' }

export default function UnidadesPage() {
  const { id } = useParams<{ id: string }>()
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const res = await fetch(`/api/condominios/${id}/unidades`)
    const data = await res.json()
    setUnidades(data.unidades ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id])

  function abrirEditar(u: Unidad) {
    setEditId(u.id)
    setForm({ codigo: u.codigo, tipo: u.tipo, piso: u.piso ? String(u.piso) : '', parqueos: String(u.parqueos) })
    setModal('editar')
    setError(null)
  }

  function cerrarModal() {
    setModal(null)
    setEditId(null)
    setForm(FORM_VACIO)
    setError(null)
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}/unidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, piso: form.piso ? Number(form.piso) : null, parqueos: Number(form.parqueos) }),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    cerrarModal()
    cargar()
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}/unidades`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, ...form, piso: form.piso ? Number(form.piso) : null, parqueos: Number(form.parqueos) }),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    cerrarModal()
    cargar()
  }

  async function eliminar(unidadId: string) {
    if (!confirm('¿Eliminar esta unidad?')) return
    await fetch(`/api/condominios/${id}/unidades`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unidadId }),
    })
    cargar()
  }

  const tipoColor = (tipo: string) => ({
    apartamento: 'bg-blue-50 text-blue-700',
    casa: 'bg-green-50 text-green-700',
    sotano: 'bg-gray-100 text-gray-600',
  }[tipo] ?? 'bg-gray-100 text-gray-600')

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Unidades</h1>
        </div>
        <button
          onClick={() => { setModal('nuevo'); setError(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nueva
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : unidades.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay unidades registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unidades.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg font-mono ${tipoColor(u.tipo)}`}>
                  {u.codigo}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {u.propietarios?.[0]?.nombre ?? <span className="text-gray-400 font-normal">Sin propietario</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[u.piso ? `Piso ${u.piso}` : null, u.parqueos ? `${u.parqueos} parqueo(s)` : null].filter(Boolean).join(' · ') || u.tipo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirEditar(u)} className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1">
                  Editar
                </button>
                <button
                  onClick={() => eliminar(u.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo / editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modal === 'nuevo' ? 'Nueva unidad' : 'Editar unidad'}
            </h2>
            <form onSubmit={modal === 'nuevo' ? agregar : guardarEdicion} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <div>
                <label className="text-sm font-medium text-gray-700">Código *</label>
                <input
                  required
                  value={form.codigo}
                  onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                  placeholder="A1, B3, ES..."
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="sotano">Sótano</option>
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Piso</label>
                  <input
                    type="number"
                    value={form.piso}
                    onChange={e => setForm(p => ({ ...p, piso: e.target.value }))}
                    placeholder="1"
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Parqueos</label>
                  <input
                    type="number"
                    value={form.parqueos}
                    onChange={e => setForm(p => ({ ...p, parqueos: e.target.value }))}
                    placeholder="0"
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
