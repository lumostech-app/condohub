'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Empleado {
  id: string
  nombre: string
  cargo: string | null
  salario: number | null
  activo: boolean
}

const FORM_VACIO = { nombre: '', cargo: '', salario: '', activo: true }

export default function EmpleadosPage() {
  const { id } = useParams<{ id: string }>()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const res = await fetch(`/api/condominios/${id}/empleados`)
    const data = await res.json()
    setEmpleados(data.empleados ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id])

  function abrirEditar(e: Empleado) {
    setEditId(e.id)
    setForm({ nombre: e.nombre, cargo: e.cargo ?? '', salario: e.salario ? String(e.salario) : '', activo: e.activo })
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
    const res = await fetch(`/api/condominios/${id}/empleados`, {
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

  async function eliminar(empId: string) {
    if (!confirm('¿Eliminar este empleado?')) return
    await fetch(`/api/condominios/${id}/empleados`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: empId }),
    })
    cargar()
  }

  const totalSalarios = empleados.filter(e => e.activo).reduce((s, e) => s + (e.salario ?? 0), 0)

  return (
    <main className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Empleados</h1>
        </div>
        <button onClick={() => { setModal('nuevo'); setError(null) }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Nuevo
        </button>
      </div>

      {totalSalarios > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-blue-500 font-semibold uppercase">Nómina mensual</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(totalSalarios)}</p>
          <p className="text-xs text-blue-400 mt-0.5">{empleados.filter(e => e.activo).length} empleados activos</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : empleados.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay empleados registrados</p>
          <p className="text-xs text-gray-300 mt-1">Conserjes, guardianes, jardineros, etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {empleados.map(emp => (
            <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-semibold text-sm shrink-0">
                  {emp.nombre.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{emp.nombre}</p>
                    {!emp.activo && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {[emp.cargo, emp.salario ? formatCurrency(emp.salario) + '/mes' : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirEditar(emp)} className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1">
                  Editar
                </button>
                <button onClick={() => eliminar(emp.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modal === 'nuevo' ? 'Nuevo empleado' : 'Editar empleado'}
            </h2>
            <form onSubmit={enviar} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              {[
                { name: 'nombre', label: 'Nombre *', placeholder: 'Carlos López', required: true },
                { name: 'cargo', label: 'Cargo', placeholder: 'Conserje, Guardián...', required: false },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    required={f.required}
                    value={form[f.name as keyof typeof form] as string}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-gray-700">Salario mensual (RD$)</label>
                <input
                  type="number"
                  value={form.salario}
                  onChange={e => setForm(p => ({ ...p, salario: e.target.value }))}
                  placeholder="15000"
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Empleado activo</span>
              </label>

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
