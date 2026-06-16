'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Pago {
  id: string
  monto: number
  fecha_pago: string
  banco: string | null
  metodo: string | null
  referencia: string | null
  registrado_por: string
  unidades: { codigo: string; propietarios: { nombre: string }[] }
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PagosPage() {
  const { id } = useParams<{ id: string }>()
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const res = await fetch(`/api/condominios/${id}/pagos?mes=${mes}&anio=${anio}`)
    const data = await res.json()
    setPagos(data.pagos ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id, mes, anio])

  const total = pagos.reduce((s, p) => s + p.monto, 0)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href={`/condominios/${id}`} className="text-sm text-gray-400">‹ Volver</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Historial de pagos</h1>
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
      {pagos.length > 0 && (
        <div className="bg-green-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-green-500 font-semibold uppercase">Total recaudado</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{pagos.length}</p>
            <p className="text-xs text-green-500">pagos</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : pagos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">Sin pagos registrados en {MESES[mes - 1]} {anio}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagos.map(pago => {
            const unidad = (pago.unidades as unknown) as { codigo: string; propietarios: { nombre: string }[] }
            return (
              <div key={pago.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs shrink-0">
                      {unidad?.codigo}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {unidad?.propietarios?.[0]?.nombre ?? 'Sin propietario'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(pago.fecha_pago)}
                        {pago.banco ? ` · ${pago.banco}` : ''}
                        {pago.referencia ? ` · #${pago.referencia}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(pago.monto)}</p>
                    <p className="text-xs text-gray-400 capitalize">{pago.registrado_por}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
