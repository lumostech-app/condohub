'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Gasto {
  id: string
  categoria: string
  descripcion: string
  monto: number
  fecha: string
  proveedor_nombre: string | null
}

const CATEGORIAS = ['empleado','proveedor','luz','agua','gas','mantenimiento','otro'] as const
const CATEGORIA_ICON: Record<string, string> = {
  empleado: '👤', proveedor: '🔧', luz: '💡', agua: '💧',
  gas: '🔥', mantenimiento: '🛠️', otro: '📋',
}

export default function GastosPage() {
  const { id } = useParams<{ id: string }>()
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio] = useState(hoy.getFullYear())
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    categoria: 'otro', descripcion: '', monto: '',
    proveedor_nombre: '', fecha: hoy.toISOString().split('T')[0],
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setLoading(true)
    const res = await fetch(`/api/condominios/${id}/gastos?mes=${mes}&anio=${anio}`)
    const data = await res.json()
    setGastos(data.gastos ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id, mes, anio])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: Number(form.monto) }),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    setModal(false)
    setForm({ categoria: 'otro', descripcion: '', monto: '', proveedor_nombre: '', fecha: hoy.toISOString().split('T')[0] })
    cargar()
  }

  async function eliminar(gastoId: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/condominios/${id}/gastos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gastoId }),
    })
    cargar()
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const total = gastos.reduce((s, g) => s + g.monto, 0)

  return (
    <main className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Gastos</h1>
        </div>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Agregar
        </button>
      </div>

      {/* Selector mes */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {MESES.map((m, i) => (
          <button key={i} onClick={() => setMes(i + 1)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mes === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Total */}
      {gastos.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Total {MESES[mes - 1]}</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(total)}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">Sin gastos en {MESES[mes - 1]}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gastos.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORIA_ICON[g.categoria] ?? '📋'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{g.descripcion}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}
                    {g.proveedor_nombre ? ` · ${g.proveedor_nombre}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-red-600">{formatCurrency(g.monto)}</p>
                <button onClick={() => eliminar(g.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo gasto</h2>
            <form onSubmit={agregar} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div>
                <label className="text-sm font-medium text-gray-700">Categoría</label>
                <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>{CATEGORIA_ICON[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {[
                { name: 'descripcion', label: 'Descripción *', placeholder: 'Pago seguridad mayo', required: true },
                { name: 'monto', label: 'Monto (RD$) *', placeholder: '18000', required: true, type: 'number' },
                { name: 'proveedor_nombre', label: 'Proveedor / Empleado', placeholder: 'Juan Seguridad', required: false },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    required={f.required}
                    value={form[f.name as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-gray-700">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">Cancelar</button>
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
