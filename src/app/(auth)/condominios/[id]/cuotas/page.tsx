'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Cuota {
  id: string
  estado: string
  monto_base: number
  mora_acumulada: number
  total_debido: number
  unidades: {
    codigo: string
    propietarios: { nombre: string; telefono: string | null }[]
  }
}

const ESTADO_CONFIG = {
  pagado:   { label: 'Pagado',   color: 'bg-green-100 text-green-700' },
  pendiente:{ label: 'Pendiente',color: 'bg-yellow-100 text-yellow-700' },
  moroso:   { label: 'Moroso',   color: 'bg-red-100 text-red-700' },
  bloqueado:{ label: 'Bloqueado',color: 'bg-gray-100 text-gray-600' },
}

export default function CuotasPage() {
  const { id } = useParams<{ id: string }>()
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loading, setLoading] = useState(true)
  const [modalPago, setModalPago] = useState<Cuota | null>(null)
  const [formPago, setFormPago] = useState({ monto: '', banco: '', referencia: '', fecha_pago: hoy.toISOString().split('T')[0] })
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setLoading(true)
    const res = await fetch(`/api/condominios/${id}/cuotas?mes=${mes}&anio=${anio}`)
    const data = await res.json()
    setCuotas(data.cuotas ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id, mes, anio])

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault()
    if (!modalPago) return
    setGuardando(true)

    await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cuota_id: modalPago.id,
        unidad_id: (modalPago.unidades as unknown as { id: string }).id,
        monto: Number(formPago.monto) || modalPago.total_debido,
        banco: formPago.banco || null,
        referencia: formPago.referencia || null,
        fecha_pago: formPago.fecha_pago,
      }),
    })

    setGuardando(false)
    setModalPago(null)
    cargar()
  }

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const pagadas = cuotas.filter(c => c.estado === 'pagado').length
  const morosas = cuotas.filter(c => c.estado === 'moroso').length

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Cuotas</h1>
      </div>

      {/* Selector mes */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {MESES.map((m, i) => (
          <button
            key={i}
            onClick={() => setMes(i + 1)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mes === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {cuotas.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-green-600">{pagadas}</p>
            <p className="text-xs text-gray-500">Pagadas</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-500">{cuotas.length - pagadas - morosas}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-red-500">{morosas}</p>
            <p className="text-xs text-gray-500">Morosas</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : cuotas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">Sin cuotas para {MESES[mes - 1]} {anio}</p>
          <p className="text-xs text-gray-300 mt-1">Las cuotas se generan automáticamente el día 1</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cuotas.map(c => {
            const cfg = ESTADO_CONFIG[c.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.pendiente
            const unidad = c.unidades
            const propietario = unidad?.propietarios?.[0]

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-gray-700">{unidad?.codigo}</span>
                    <div>
                      <p className="text-sm text-gray-800">{propietario?.nombre ?? <span className="text-gray-400">Sin propietario</span>}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(c.total_debido)}{c.mora_acumulada > 0 ? ` (mora: ${formatCurrency(c.mora_acumulada)})` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${cfg.color}`}>{cfg.label}</span>
                    {c.estado !== 'pagado' && (
                      <button
                        onClick={() => { setModalPago(c); setFormPago(p => ({ ...p, monto: String(c.total_debido) })) }}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal pago manual */}
      {modalPago && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Registrar pago</h2>
            <p className="text-sm text-gray-500 mb-4">
              Unidad <strong>{modalPago.unidades?.codigo}</strong> — {formatCurrency(modalPago.total_debido)}
            </p>
            <form onSubmit={registrarPago} className="space-y-3">
              {[
                { name: 'monto', label: 'Monto (RD$)', type: 'number', required: true },
                { name: 'banco', label: 'Banco', type: 'text', required: false },
                { name: 'referencia', label: 'Referencia', type: 'text', required: false },
                { name: 'fecha_pago', label: 'Fecha', type: 'date', required: true },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={formPago[f.name as keyof typeof formPago]}
                    onChange={e => setFormPago(p => ({ ...p, [f.name]: e.target.value }))}
                    className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalPago(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardando ? 'Registrando...' : '✓ Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
