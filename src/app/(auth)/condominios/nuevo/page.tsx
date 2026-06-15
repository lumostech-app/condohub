'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface UnidadEdificio {
  nombre: string
  niveles: number
  tiene_sotano: boolean
  unidades: string[]
}

interface Estructura {
  nombre: string
  direccion: string
  tipo: 'residencial_multi' | 'edificio_solo' | 'casas'
  edificios: UnidadEdificio[]
  total_unidades: number
}

interface ResidenteImportado {
  unidad_codigo: string
  nombre: string
  cedula: string
  telefono: string
  email: string
}

// ─── Componente: Barra de progreso ───────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const pasos = ['Estructura', 'Residentes', 'Cuotas']
  return (
    <div className="flex items-center gap-2 mb-8">
      {pasos.map((label, i) => {
        const num = i + 1
        const activo = num === step
        const completado = num < step
        return (
          <div key={num} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  completado
                    ? 'bg-green-500 text-white'
                    : activo
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {completado ? '✓' : num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${activo ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div className={`h-px flex-1 ${completado ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Paso 1: Describir y confirmar estructura ─────────────────────────────────

function PasoDescribir({ onNext }: { onNext: (id: string, estructura: Estructura) => void }) {
  const [descripcion, setDescripcion] = useState('')
  const [estructura, setEstructura] = useState<Estructura | null>(null)
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState(false)

  async function analizar() {
    if (!descripcion.trim()) return
    setLoading(true)
    setError(null)
    setEstructura(null)

    const res = await fetch('/api/onboarding/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setError(data.error ?? 'Error al analizar. Intenta de nuevo.')
      return
    }
    setEstructura(data.estructura)
  }

  async function confirmar() {
    if (!estructura) return
    setGuardando(true)
    setError(null)

    const res = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estructura }),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok || data.error) {
      setError(data.error ?? 'Error guardando. Intenta de nuevo.')
      return
    }
    onNext(data.condominioId, estructura)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">¿Cómo es tu condominio?</h1>
      <p className="text-sm text-gray-500 mb-6">Descríbelo con tus propias palabras</p>

      {!estructura ? (
        <>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={5}
            placeholder={`Ej: Residencial Las Palmas, en la Av. Winston Churchill #45. Tiene 4 edificios del A al D, todos de 4 pisos. El C y D incluyen sótano.`}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {error && (
            <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={analizar}
            disabled={loading || !descripcion.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analizando con IA...' : 'Analizar ›'}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">
            La IA detectará edificios, pisos y unidades automáticamente
          </p>
        </>
      ) : (
        <>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
              Esto encontré
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-base">🏘️</span>
                <div>
                  <p className="font-semibold text-gray-900">{estructura.nombre}</p>
                  {estructura.direccion && (
                    <p className="text-xs text-gray-500">{estructura.direccion}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🏢</span>
                <p className="text-sm text-gray-700">
                  {estructura.edificios.length} edificio{estructura.edificios.length !== 1 ? 's' : ''}
                  {' · '}
                  <strong>{estructura.total_unidades}</strong> unidades en total
                </p>
              </div>
            </div>

            <button
              onClick={() => setExpandido(!expandido)}
              className="mt-3 text-xs text-blue-600 font-medium"
            >
              {expandido ? 'Ocultar detalle ↑' : 'Ver todas las unidades ↓'}
            </button>

            {expandido && (
              <div className="mt-3 space-y-2">
                {estructura.edificios.map(ed => (
                  <div key={ed.nombre} className="bg-white rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">{ed.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {ed.unidades.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={confirmar}
            disabled={guardando}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {guardando ? 'Guardando...' : 'Confirmar y continuar ›'}
          </button>

          <button
            onClick={() => { setEstructura(null); setError(null) }}
            className="mt-3 w-full text-sm text-gray-500 py-2"
          >
            Escribir de nuevo
          </button>
        </>
      )}
    </div>
  )
}

// ─── Paso 2: Residentes ───────────────────────────────────────────────────────

function PasoResidentes({
  condominioId,
  onNext,
}: {
  condominioId: string
  onNext: () => void
}) {
  const [tab, setTab] = useState<'excel' | 'uno'>('excel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [excelData, setExcelData] = useState<ResidenteImportado[] | null>(null)
  const [resultado, setResultado] = useState<{ importados: number; errores: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Estado para agregar uno por uno
  const [textoUno, setTextoUno] = useState('')
  const [listaUno, setListaUno] = useState<ResidenteImportado[]>([])

  async function subirExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('condominioId', condominioId)

    const res = await fetch('/api/onboarding/import-excel', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setError(data.error ?? 'Error procesando el archivo')
      return
    }
    setExcelData(data.data)
  }

  async function confirmarExcel() {
    if (!excelData) return
    setLoading(true)

    const res = await fetch('/api/onboarding/confirm-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condominioId, residentes: excelData }),
    })
    const data = await res.json()
    setLoading(false)
    setResultado(data)
  }

  function agregarUno() {
    if (!textoUno.trim()) return
    const partes = textoUno.split(',').map(s => s.trim())
    const nuevo: ResidenteImportado = {
      nombre: partes[0] ?? '',
      unidad_codigo: partes[1] ?? '',
      telefono: partes[2] ?? '',
      cedula: partes[3] ?? '',
      email: partes[4] ?? '',
    }
    if (!nuevo.nombre) return
    setListaUno(prev => [...prev, nuevo])
    setTextoUno('')
  }

  async function guardarUnoAPorUno() {
    if (listaUno.length === 0) { onNext(); return }
    setLoading(true)

    const res = await fetch('/api/onboarding/confirm-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condominioId, residentes: listaUno }),
    })
    const data = await res.json()
    setLoading(false)
    setResultado(data)
  }

  if (resultado) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Residentes importados</h1>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 my-6">
          <p className="text-green-700 font-semibold text-lg">✅ {resultado.importados} importados</p>
          {resultado.errores.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-orange-600 mb-1">⚠️ Con problemas:</p>
              {resultado.errores.map((e, i) => (
                <p key={i} className="text-xs text-gray-600">• {e}</p>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onNext}
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          Continuar ›
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Agregar residentes</h1>
      <p className="text-sm text-gray-500 mb-6">Opcional · Puedes hacerlo luego desde el panel</p>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        {(['excel', 'uno'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'excel' ? '📊 Subir Excel' : '✍️ Uno por uno'}
          </button>
        ))}
      </div>

      {tab === 'excel' && !excelData && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 transition-colors"
          >
            {loading ? (
              <p className="text-sm text-gray-500">Procesando con IA...</p>
            ) : (
              <>
                <p className="text-3xl mb-2">📄</p>
                <p className="text-sm font-medium text-gray-700">Toca para subir Excel o CSV</p>
                <p className="text-xs text-gray-400 mt-1">Cualquier formato · Claude detecta las columnas</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={subirExcel}
            className="hidden"
          />
          {error && (
            <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
        </div>
      )}

      {tab === 'excel' && excelData && (
        <div>
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {excelData.length} residentes detectados — previsualización:
            </p>
            <div className="space-y-1">
              {excelData.slice(0, 5).map((r, i) => (
                <div key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="font-mono bg-white rounded px-1">{r.unidad_codigo || '—'}</span>
                  <span>{r.nombre}</span>
                  {r.telefono && <span className="text-gray-400">{r.telefono}</span>}
                </div>
              ))}
              {excelData.length > 5 && (
                <p className="text-xs text-gray-400">... y {excelData.length - 5} más</p>
              )}
            </div>
          </div>
          <button
            onClick={confirmarExcel}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Importando...' : `Importar ${excelData.length} residentes ›`}
          </button>
          <button
            onClick={() => setExcelData(null)}
            className="mt-3 w-full text-sm text-gray-500 py-2"
          >
            Subir otro archivo
          </button>
        </div>
      )}

      {tab === 'uno' && (
        <div>
          <div className="bg-gray-50 rounded-2xl p-3 mb-4">
            <p className="text-xs text-gray-500">Escribe: <span className="font-mono">Nombre, Unidad, Teléfono</span></p>
            <p className="text-xs text-gray-400">Ej: María González, A3, 809-555-1234</p>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={textoUno}
              onChange={e => setTextoUno(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarUno()}
              placeholder="María González, A3, 809-555-1234"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={agregarUno}
              className="bg-blue-600 text-white px-4 rounded-2xl text-sm font-medium"
            >
              +
            </button>
          </div>
          {listaUno.length > 0 && (
            <div className="space-y-2 mb-4">
              {listaUno.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{r.nombre}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.unidad_codigo}</span>
                  </div>
                  <button
                    onClick={() => setListaUno(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {listaUno.length > 0 && (
            <button
              onClick={guardarUnoAPorUno}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium text-sm mb-3 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : `Guardar ${listaUno.length} residente${listaUno.length !== 1 ? 's' : ''} ›`}
            </button>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors mt-3"
      >
        Omitir por ahora
      </button>
    </div>
  )
}

// ─── Paso 3: Configurar cuotas ────────────────────────────────────────────────

function PasoCuotas({
  condominioId,
  onFinish,
}: {
  condominioId: string
  onFinish: () => void
}) {
  const [form, setForm] = useState({
    monto_base: '',
    dias_gracia: '5',
    porcentaje_mora: '5',
    dia_cobro: '1',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function guardar() {
    if (!form.monto_base) { setError('El monto de cuota es requerido'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/onboarding/config-cuotas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condominioId, ...form }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) { setError(data.error ?? 'Error guardando'); return }
    onFinish()
  }

  const fields = [
    { name: 'monto_base',      label: 'Cuota mensual (RD$)',  type: 'number', placeholder: '3500' },
    { name: 'dias_gracia',     label: 'Días de gracia',        type: 'number', placeholder: '5' },
    { name: 'porcentaje_mora', label: 'Mora (%)',              type: 'number', placeholder: '5' },
    { name: 'dia_cobro',       label: 'Día de cobro del mes',  type: 'number', placeholder: '1' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Configurar cuotas</h1>
      <p className="text-sm text-gray-500 mb-6">
        La misma cuota aplica a todas las unidades. Puedes cambiarla luego.
      </p>

      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 rounded-2xl p-4 text-xs text-gray-600">
        El sistema enviará recordatorios automáticos a residentes los días 1, 5 y 15 del mes.
        La mora se aplica tras {form.dias_gracia || 5} días de retraso.
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <button
        onClick={guardar}
        disabled={loading}
        className="mt-5 w-full bg-green-600 text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Guardando...' : '✓ Finalizar configuración'}
      </button>

      <button onClick={onFinish} className="mt-3 w-full text-sm text-gray-400 py-2">
        Configurar luego
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function NuevoCondominioPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [condominioId, setCondominioId] = useState<string | null>(null)

  function handlePaso1(id: string) {
    setCondominioId(id)
    setStep(2)
  }

  function handlePaso2() {
    setStep(3)
  }

  function handleFinish() {
    router.push(condominioId ? `/condominios/${condominioId}` : '/condominios')
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ‹ Volver
        </button>
        <h2 className="text-sm font-medium text-gray-500">Nuevo condominio</h2>
      </div>

      <ProgressBar step={step} />

      {step === 1 && <PasoDescribir onNext={handlePaso1} />}
      {step === 2 && condominioId && (
        <PasoResidentes condominioId={condominioId} onNext={handlePaso2} />
      )}
      {step === 3 && condominioId && (
        <PasoCuotas condominioId={condominioId} onFinish={handleFinish} />
      )}
    </main>
  )
}
