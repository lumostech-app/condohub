'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Area {
  id: string
  nombre: string
  capacidad: number | null
  hora_apertura: string | null
  hora_cierre: string | null
  requiere_aprobacion: boolean
  activa: boolean
}

interface Reservacion {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  notas: string | null
  unidades: { codigo: string; propietarios: { nombre: string }[] }
}

interface Unidad {
  id: string
  codigo: string
}

const FORM_AREA_VACIO = { nombre: '', capacidad: '', hora_apertura: '', hora_cierre: '', requiere_aprobacion: true }
const FORM_RES_VACIO = { unidad_id: '', fecha: '', hora_inicio: '08:00', hora_fin: '12:00', notas: '' }

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  cancelada: 'bg-gray-100 text-gray-500',
}

export default function AreasPage() {
  const { id } = useParams<{ id: string }>()
  const [areas, setAreas] = useState<Area[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [areaExpandida, setAreaExpandida] = useState<string | null>(null)
  const [reservaciones, setReservaciones] = useState<Record<string, Reservacion[]>>({})
  const [modalArea, setModalArea] = useState<'nuevo' | 'editar' | null>(null)
  const [editAreaId, setEditAreaId] = useState<string | null>(null)
  const [formArea, setFormArea] = useState(FORM_AREA_VACIO)
  const [modalRes, setModalRes] = useState<string | null>(null) // areaId
  const [formRes, setFormRes] = useState(FORM_RES_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const [resAreas, resUnid] = await Promise.all([
      fetch(`/api/condominios/${id}/areas`),
      fetch(`/api/condominios/${id}/unidades`),
    ])
    const dataAreas = await resAreas.json()
    const dataUnid = await resUnid.json()
    setAreas(dataAreas.areas ?? [])
    setUnidades(dataUnid.unidades ?? [])
    setLoading(false)
  }

  async function cargarReservaciones(areaId: string) {
    const res = await fetch(`/api/condominios/${id}/areas/${areaId}/reservaciones`)
    const data = await res.json()
    setReservaciones(prev => ({ ...prev, [areaId]: data.reservaciones ?? [] }))
  }

  useEffect(() => { cargar() }, [id])

  function expandir(areaId: string) {
    if (areaExpandida === areaId) { setAreaExpandida(null); return }
    setAreaExpandida(areaId)
    cargarReservaciones(areaId)
  }

  function abrirEditarArea(a: Area) {
    setEditAreaId(a.id)
    setFormArea({ nombre: a.nombre, capacidad: a.capacidad ? String(a.capacidad) : '', hora_apertura: a.hora_apertura ?? '', hora_cierre: a.hora_cierre ?? '', requiere_aprobacion: a.requiere_aprobacion })
    setModalArea('editar')
    setError(null)
  }

  function cerrarModalArea() { setModalArea(null); setEditAreaId(null); setFormArea(FORM_AREA_VACIO); setError(null) }
  function cerrarModalRes() { setModalRes(null); setFormRes(FORM_RES_VACIO); setError(null) }

  async function enviarArea(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const isEdit = modalArea === 'editar'
    const res = await fetch(`/api/condominios/${id}/areas`, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: editAreaId, ...formArea } : formArea),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    cerrarModalArea()
    cargar()
  }

  async function eliminarArea(areaId: string) {
    if (!confirm('¿Eliminar esta área? También se eliminarán sus reservaciones.')) return
    await fetch(`/api/condominios/${id}/areas`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: areaId }),
    })
    cargar()
  }

  async function enviarReservacion(e: React.FormEvent) {
    e.preventDefault()
    if (!modalRes) return
    setGuardando(true)
    setError(null)

    const res = await fetch(`/api/condominios/${id}/areas/${modalRes}/reservaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formRes),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    cerrarModalRes()
    cargarReservaciones(modalRes)
  }

  async function cambiarEstado(areaId: string, resId: string, estado: string) {
    await fetch(`/api/condominios/${id}/areas/${areaId}/reservaciones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resId, estado }),
    })
    cargarReservaciones(areaId)
  }

  async function eliminarReservacion(areaId: string, resId: string) {
    if (!confirm('¿Eliminar esta reservación?')) return
    await fetch(`/api/condominios/${id}/areas/${areaId}/reservaciones`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resId }),
    })
    cargarReservaciones(areaId)
  }

  return (
    <main className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Áreas comunes</h1>
        </div>
        <button onClick={() => { setModalArea('nuevo'); setError(null) }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Nueva
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : areas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay áreas comunes registradas</p>
          <p className="text-xs text-gray-300 mt-1">Piscina, salón de fiestas, gimnasio, BBQ...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {areas.map(area => (
            <div key={area.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => expandir(area.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏊</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{area.nombre}</p>
                      {!area.activa && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Inactiva</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {[
                        area.capacidad ? `Cap. ${area.capacidad}` : null,
                        area.hora_apertura ? `${area.hora_apertura}–${area.hora_cierre}` : null,
                        area.requiere_aprobacion ? 'Aprobación requerida' : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={ev => { ev.stopPropagation(); abrirEditarArea(area) }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={ev => { ev.stopPropagation(); eliminarArea(area.id) }}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                  >
                    ×
                  </button>
                  <span className={`text-gray-300 transition-transform ${areaExpandida === area.id ? 'rotate-90' : ''}`}>›</span>
                </div>
              </div>

              {areaExpandida === area.id && (
                <div className="border-t border-gray-50 px-4 pb-4">
                  <div className="flex items-center justify-between py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Reservaciones</p>
                    <button
                      onClick={() => { setModalRes(area.id); setError(null) }}
                      className="text-xs text-blue-600 font-medium"
                    >
                      + Agregar
                    </button>
                  </div>

                  {!reservaciones[area.id] ? (
                    <p className="text-xs text-gray-400 text-center py-3">Cargando...</p>
                  ) : reservaciones[area.id].length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Sin reservaciones</p>
                  ) : (
                    <div className="space-y-2">
                      {reservaciones[area.id].map(res => {
                        const unidad = (res.unidades as unknown) as { codigo: string; propietarios: { nombre: string }[] }
                        return (
                          <div key={res.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-gray-700">{unidad?.codigo}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ESTADO_COLORS[res.estado] ?? ''}`}>
                                  {res.estado}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(res.fecha + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' })} · {res.hora_inicio}–{res.hora_fin}
                              </p>
                              {unidad?.propietarios?.[0]?.nombre && (
                                <p className="text-xs text-gray-400">{unidad.propietarios[0].nombre}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {res.estado === 'pendiente' && (
                                <>
                                  <button onClick={() => cambiarEstado(area.id, res.id, 'aprobada')} className="text-xs text-green-600 font-medium px-2 py-1">✓</button>
                                  <button onClick={() => cambiarEstado(area.id, res.id, 'rechazada')} className="text-xs text-red-500 font-medium px-2 py-1">✕</button>
                                </>
                              )}
                              <button onClick={() => eliminarReservacion(area.id, res.id)} className="text-gray-300 hover:text-red-400 text-lg ml-1">×</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal área */}
      {modalArea && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modalArea === 'nuevo' ? 'Nueva área común' : 'Editar área'}
            </h2>
            <form onSubmit={enviarArea} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div>
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  required
                  value={formArea.nombre}
                  onChange={e => setFormArea(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Piscina, Salón de fiestas..."
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Capacidad (personas)</label>
                <input
                  type="number"
                  value={formArea.capacidad}
                  onChange={e => setFormArea(p => ({ ...p, capacidad: e.target.value }))}
                  placeholder="50"
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Apertura</label>
                  <input
                    type="time"
                    value={formArea.hora_apertura}
                    onChange={e => setFormArea(p => ({ ...p, hora_apertura: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cierre</label>
                  <input
                    type="time"
                    value={formArea.hora_cierre}
                    onChange={e => setFormArea(p => ({ ...p, hora_cierre: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={formArea.requiere_aprobacion}
                  onChange={e => setFormArea(p => ({ ...p, requiere_aprobacion: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Requiere aprobación del admin</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModalArea} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardando ? 'Guardando...' : modalArea === 'nuevo' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal reservación */}
      {modalRes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nueva reservación</h2>
            <form onSubmit={enviarReservacion} className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div>
                <label className="text-sm font-medium text-gray-700">Unidad *</label>
                <select
                  required
                  value={formRes.unidad_id}
                  onChange={e => setFormRes(p => ({ ...p, unidad_id: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar unidad</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Fecha *</label>
                <input
                  type="date"
                  required
                  value={formRes.fecha}
                  onChange={e => setFormRes(p => ({ ...p, fecha: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Inicio</label>
                  <input
                    type="time"
                    value={formRes.hora_inicio}
                    onChange={e => setFormRes(p => ({ ...p, hora_inicio: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fin</label>
                  <input
                    type="time"
                    value={formRes.hora_fin}
                    onChange={e => setFormRes(p => ({ ...p, hora_fin: e.target.value }))}
                    className="mt-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <input
                  value={formRes.notas}
                  onChange={e => setFormRes(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Cumpleaños, reunión..."
                  className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModalRes} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardando ? 'Reservando...' : 'Reservar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
