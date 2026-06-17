'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Config {
  monto_base: number
  dia_cobro: number
  dias_gracia: number
  porcentaje_mora: number
  bloqueo_reservas: boolean
}

export default function ConfigCuotasPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState<Config>({
    monto_base: 0,
    dia_cobro: 1,
    dias_gracia: 5,
    porcentaje_mora: 5,
    bloqueo_reservas: true,
  })
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  useEffect(() => {
    fetch(`/api/onboarding/config-cuotas?condominioId=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setForm({
            monto_base: data.config.monto_base ?? 0,
            dia_cobro: data.config.dia_cobro ?? 1,
            dias_gracia: data.config.dias_gracia ?? 5,
            porcentaje_mora: data.config.porcentaje_mora ?? 5,
            bloqueo_reservas: data.config.bloqueo_reservas ?? true,
          })
        }
        setLoading(false)
      })
  }, [id])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch('/api/onboarding/config-cuotas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condominioId: id, ...form }),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    setExito(true)
    setTimeout(() => { setExito(false); router.push(`/condominios/${id}`) }, 1500)
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
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Configuración de cuotas</h1>
        <p className="text-sm text-gray-400 mt-1">El cron genera cuotas automáticamente el día 1 de cada mes.</p>
      </div>

      {exito && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          ✓ Configuración guardada correctamente
        </div>
      )}

      <form onSubmit={guardar} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto de cuota mensual (RD$) *
          </label>
          <input
            type="number"
            required
            min={1}
            value={form.monto_base || ''}
            onChange={e => setForm(p => ({ ...p, monto_base: Number(e.target.value) }))}
            placeholder="3500"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día de cobro
            </label>
            <input
              type="number"
              min={1}
              max={28}
              value={form.dia_cobro}
              onChange={e => setForm(p => ({ ...p, dia_cobro: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Del 1 al 28</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días de gracia
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={form.dias_gracia}
              onChange={e => setForm(p => ({ ...p, dias_gracia: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Días sin mora</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje de mora (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={form.porcentaje_mora}
            onChange={e => setForm(p => ({ ...p, porcentaje_mora: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Se aplica al monto base después de los días de gracia</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.bloqueo_reservas}
            onChange={e => setForm(p => ({ ...p, bloqueo_reservas: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Bloquear reservas a morosos</p>
            <p className="text-xs text-gray-400">Las unidades morosas no pueden reservar áreas comunes</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </main>
  )
}
