'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarCondominioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', direccion: '', descripcion: '' })
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/condominios/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.condominio) {
          setForm({
            nombre: data.condominio.nombre ?? '',
            direccion: data.condominio.direccion ?? '',
            descripcion: data.condominio.descripcion ?? '',
          })
        }
        setLoading(false)
      })
  }, [id])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    router.push(`/condominios/${id}`)
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto">
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar condominio</h1>
      </div>

      <form onSubmit={guardar} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            required
            value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Torre Bella Vista"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            value={form.direccion}
            onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
            placeholder="Av. 27 de Febrero, Santo Domingo"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            rows={3}
            placeholder="Descripción opcional del condominio..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href={`/condominios/${id}`}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </main>
  )
}
