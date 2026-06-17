'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EdificioConfig {
  letra: string
  unidades: number
  sotano: boolean
}

interface ResidenteImportado {
  unidad_codigo: string
  nombre: string
  cedula: string
  telefono: string
  email: string
}

// ─── Barra de progreso ────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const pasos = ['Información', 'Propietarios', 'Cuotas']
  return (
    <div className="flex items-center gap-2 mb-8">
      {pasos.map((label, i) => {
        const num = i + 1
        const activo = num === step
        const completado = num < step
        return (
          <div key={num} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                completado ? 'bg-green-500 text-white' : activo ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
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

// ─── Generador de letras ──────────────────────────────────────────────────────

function letraDesde(n: number): string {
  return String.fromCharCode(64 + n) // 1→A, 2→B...
}

function generarEdificios(count: number, unidadesBase: number): EdificioConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    letra: letraDesde(i + 1),
    unidades: unidadesBase,
    sotano: false,
  }))
}

// ─── Paso 1: Formulario ───────────────────────────────────────────────────────

const TIPOS = [
  { value: 'residencial_multi', label: 'Residencial (varios edificios)' },
  { value: 'edificio_solo',     label: 'Edificio único' },
  { value: 'casas',             label: 'Urbanización / casas' },
]

function PasoInfo({ onNext }: { onNext: (id: string) => void }) {
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    tipo: 'residencial_multi' as 'residencial_multi' | 'edificio_solo' | 'casas',
    // edificio_solo / casas
    totalUnidades: '',
    prefijo: '',
    // residencial_multi
    numEdificios: 2,
    unidadesPorEdificio: 4,
  })
  const [edificios, setEdificios] = useState<EdificioConfig[]>(generarEdificios(2, 4))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleField(name: string, value: string | number) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleTipo(value: string) {
    const t = value as typeof form.tipo
    setForm(prev => ({ ...prev, tipo: t }))
  }

  function handleNumEdificios(n: number) {
    const count = Math.max(1, Math.min(26, n))
    setForm(prev => ({ ...prev, numEdificios: count }))
    setEdificios(prev => {
      if (count > prev.length) {
        const extras = Array.from({ length: count - prev.length }, (_, i) => ({
          letra: letraDesde(prev.length + i + 1),
          unidades: form.unidadesPorEdificio,
          sotano: false,
        }))
        return [...prev, ...extras]
      }
      return prev.slice(0, count)
    })
  }

  function handleUnidadesPorEdificio(n: number) {
    const u = Math.max(1, Math.min(200, n))
    setForm(prev => ({ ...prev, unidadesPorEdificio: u }))
    setEdificios(prev => prev.map(e => ({ ...e, unidades: u })))
  }

  function toggleSotano(letra: string) {
    setEdificios(prev => prev.map(e => e.letra === letra ? { ...e, sotano: !e.sotano } : e))
  }

  function setUnidadesEdificio(letra: string, n: number) {
    setEdificios(prev => prev.map(e => e.letra === letra ? { ...e, unidades: Math.max(1, n) } : e))
  }

  // Construir estructura para la API
  function buildEstructura() {
    if (form.tipo === 'casas' || form.tipo === 'edificio_solo') {
      const total = parseInt(form.totalUnidades)
      const prefix = form.prefijo.trim()
      const unidades = Array.from({ length: total }, (_, i) => prefix ? `${prefix}${i + 1}` : String(i + 1))
      return {
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        tipo: form.tipo,
        edificios: [{ nombre: form.nombre.trim(), niveles: 1, tiene_sotano: false, unidades }],
        total_unidades: total,
      }
    }

    // residencial_multi
    const edsConUnidades = edificios.map(ed => {
      const units: string[] = Array.from({ length: ed.unidades }, (_, i) => `${ed.letra}${i + 1}`)
      if (ed.sotano) units.push(`${ed.letra}S`)
      return {
        nombre: `Edificio ${ed.letra}`,
        niveles: 1,
        tiene_sotano: ed.sotano,
        unidades: units,
      }
    })
    const total = edsConUnidades.reduce((s, e) => s + e.unidades.length, 0)
    return {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      tipo: form.tipo,
      edificios: edsConUnidades,
      total_unidades: total,
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }

    if (form.tipo !== 'residencial_multi') {
      const total = parseInt(form.totalUnidades)
      if (!total || total < 1 || total > 999) { setError('Ingresa un número de unidades válido (1-999)'); return }
    }

    setLoading(true)
    setError(null)

    const estructura = buildEstructura()
    const res = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estructura }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) { setError(data.error ?? 'Error guardando. Intenta de nuevo.'); return }
    onNext(data.condominioId)
  }

  // Preview total
  const totalPreview = form.tipo === 'residencial_multi'
    ? edificios.reduce((s, e) => s + e.unidades + (e.sotano ? 1 : 0), 0)
    : parseInt(form.totalUnidades) || 0

  // Preview primeros códigos
  const codigosPreview: string[] = form.tipo === 'residencial_multi'
    ? edificios.slice(0, 3).flatMap(e => {
        const arr = Array.from({ length: Math.min(e.unidades, 4) }, (_, i) => `${e.letra}${i + 1}`)
        if (e.sotano) arr.push(`${e.letra}S`)
        return arr
      })
    : (() => {
        const total = parseInt(form.totalUnidades) || 0
        const prefix = form.prefijo.trim()
        return Array.from({ length: Math.min(total, 5) }, (_, i) => prefix ? `${prefix}${i + 1}` : String(i + 1))
      })()

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nuevo condominio</h1>
        <p className="text-sm text-gray-500">Completa la información básica para empezar</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del condominio</label>
        <input
          type="text" required value={form.nombre}
          onChange={e => handleField('nombre', e.target.value)}
          placeholder="Ej: Residencial Madrigal I"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección <span className="text-gray-400 font-normal">(opcional)</span></label>
        <input
          type="text" value={form.direccion}
          onChange={e => handleField('direccion', e.target.value)}
          placeholder="Ej: Av. Carlos Pérez Ricart, Santo Domingo"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de propiedad</label>
        <select
          value={form.tipo} onChange={e => handleTipo(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* ── RESIDENCIAL MULTI ── */}
      {form.tipo === 'residencial_multi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de edificios</label>
              <input
                type="number" min="1" max="26"
                value={form.numEdificios}
                onChange={e => handleNumEdificios(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Aptos por edificio</label>
              <input
                type="number" min="1" max="200"
                value={form.unidadesPorEdificio}
                onChange={e => handleUnidadesPorEdificio(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabla de edificios */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Configuración por edificio</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500">Edificio</th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500">Aptos</th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500 text-center">Sótano</th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500">Códigos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {edificios.map(ed => (
                    <tr key={ed.letra}>
                      <td className="px-3 py-2 font-mono font-bold text-gray-700">{ed.letra}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="1" max="200"
                          value={ed.unidades}
                          onChange={e => setUnidadesEdificio(ed.letra, parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={ed.sotano}
                          onChange={() => toggleSotano(ed.letra)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                        {ed.letra}1–{ed.letra}{ed.unidades}{ed.sotano ? `, ${ed.letra}S` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIFICIO SOLO / CASAS ── */}
      {form.tipo !== 'residencial_multi' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.tipo === 'casas' ? 'Número de casas' : 'Número de unidades'}
            </label>
            <input
              type="number" required min="1" max="999"
              value={form.totalUnidades}
              onChange={e => handleField('totalUnidades', e.target.value)}
              placeholder="Ej: 20"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prefijo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text" maxLength={4}
              value={form.prefijo}
              onChange={e => handleField('prefijo', e.target.value)}
              placeholder="Ej: Apto, Casa"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {totalPreview > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-700">Vista previa · {totalPreview} unidades</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {codigosPreview.map(u => (
              <span key={u} className="text-xs font-mono bg-white border border-blue-100 rounded px-2 py-0.5 text-gray-700">{u}</span>
            ))}
            {form.tipo === 'residencial_multi' && edificios.length > 3 && (
              <span className="text-xs text-blue-400 py-0.5">... y más edificios</span>
            )}
            {form.tipo !== 'residencial_multi' && totalPreview > 5 && (
              <span className="text-xs text-blue-400 py-0.5">... hasta {form.prefijo}{totalPreview}</span>
            )}
          </div>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creando...' : 'Crear condominio y continuar →'}
      </button>
    </form>
  )
}

// ─── Paso 2: Propietarios ─────────────────────────────────────────────────────

function PasoPropietarios({ condominioId, onNext }: { condominioId: string; onNext: () => void }) {
  const [tab, setTab] = useState<'excel' | 'uno'>('excel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [excelData, setExcelData] = useState<ResidenteImportado[] | null>(null)
  const [resultado, setResultado] = useState<{ importados: number; errores: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [textoUno, setTextoUno] = useState('')
  const [listaUno, setListaUno] = useState<ResidenteImportado[]>([])

  async function subirExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('condominioId', condominioId)
    const res = await fetch('/api/onboarding/import-excel', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)
    if (!res.ok || data.error) { setError(data.error ?? 'Error procesando el archivo'); return }
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
    const nuevo: ResidenteImportado = { nombre: partes[0] ?? '', unidad_codigo: partes[1] ?? '', telefono: partes[2] ?? '', cedula: partes[3] ?? '', email: partes[4] ?? '' }
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

  if (resultado) return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Propietarios importados</h1>
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 my-6">
        <p className="text-green-700 font-semibold text-lg">✅ {resultado.importados} importados</p>
        {resultado.errores.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-orange-600 mb-1">⚠️ Con problemas:</p>
            {resultado.errores.map((e, i) => <p key={i} className="text-xs text-gray-600">• {e}</p>)}
          </div>
        )}
      </div>
      <button onClick={onNext} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">Continuar →</button>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Agregar propietarios</h1>
      <p className="text-sm text-gray-500 mb-6">Opcional · Puedes hacerlo luego desde el panel</p>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {(['excel', 'uno'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t === 'excel' ? '📊 Subir Excel' : '✍️ Uno por uno'}
          </button>
        ))}
      </div>

      {tab === 'excel' && !excelData && (
        <div>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 transition-colors">
            {loading ? <p className="text-sm text-gray-500">Procesando...</p> : (
              <><p className="text-3xl mb-2">📄</p><p className="text-sm font-medium text-gray-700">Toca para subir Excel o CSV</p><p className="text-xs text-gray-400 mt-1">Cualquier formato · Claude detecta las columnas</p></>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={subirExcel} className="hidden" />
          {error && <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
        </div>
      )}

      {tab === 'excel' && excelData && (
        <div>
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">{excelData.length} propietarios detectados:</p>
            <div className="space-y-1">
              {excelData.slice(0, 5).map((r, i) => (
                <div key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="font-mono bg-white rounded px-1">{r.unidad_codigo || '—'}</span>
                  <span>{r.nombre}</span>
                  {r.telefono && <span className="text-gray-400">{r.telefono}</span>}
                </div>
              ))}
              {excelData.length > 5 && <p className="text-xs text-gray-400">... y {excelData.length - 5} más</p>}
            </div>
          </div>
          <button onClick={confirmarExcel} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium text-sm disabled:opacity-50">
            {loading ? 'Importando...' : `Importar ${excelData.length} propietarios →`}
          </button>
          <button onClick={() => setExcelData(null)} className="mt-3 w-full text-sm text-gray-500 py-2">Subir otro archivo</button>
        </div>
      )}

      {tab === 'uno' && (
        <div>
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-0.5">Formato: <span className="font-mono">Nombre, Unidad, Teléfono</span></p>
            <p className="text-xs text-gray-400">Ej: María González, A3, 809-555-1234</p>
          </div>
          <div className="flex gap-2 mb-4">
            <input value={textoUno} onChange={e => setTextoUno(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarUno()}
              placeholder="María González, A3, 809-555-1234"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={agregarUno} className="bg-blue-600 text-white px-4 rounded-xl text-sm font-medium">+</button>
          </div>
          {listaUno.length > 0 && (
            <div className="space-y-2 mb-4">
              {listaUno.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                  <div><span className="text-sm font-medium text-gray-800">{r.nombre}</span><span className="text-xs text-gray-400 ml-2">{r.unidad_codigo}</span></div>
                  <button onClick={() => setListaUno(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
          {listaUno.length > 0 && (
            <button onClick={guardarUnoAPorUno} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium text-sm mb-3 disabled:opacity-50">
              {loading ? 'Guardando...' : `Guardar ${listaUno.length} propietario${listaUno.length !== 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      )}

      <button onClick={onNext} className="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors mt-3">
        Omitir por ahora
      </button>
    </div>
  )
}

// ─── Paso 3: Cuotas ───────────────────────────────────────────────────────────

function PasoCuotas({ condominioId, onFinish }: { condominioId: string; onFinish: () => void }) {
  const [form, setForm] = useState({ monto_base: '', dias_gracia: '5', porcentaje_mora: '5', dia_cobro: '1' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.monto_base) { setError('El monto de cuota es requerido'); return }
    setLoading(true); setError(null)
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

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Configurar cuotas</h1>
        <p className="text-sm text-gray-500">La misma cuota aplica a todas las unidades. Puedes cambiarla luego.</p>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {[
        { name: 'monto_base',      label: 'Cuota mensual (RD$)',  placeholder: '3500', hint: 'Monto base por unidad' },
        { name: 'dias_gracia',     label: 'Días de gracia',        placeholder: '5',    hint: 'Días antes de aplicar mora' },
        { name: 'porcentaje_mora', label: 'Mora (%)',              placeholder: '5',    hint: 'Porcentaje sobre la cuota' },
        { name: 'dia_cobro',       label: 'Día de cobro del mes',  placeholder: '1',    hint: 'Día en que se genera la cuota' },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
          <input name={f.name} type="number" value={form[f.name as keyof typeof form]}
            onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">{f.hint}</p>
        </div>
      ))}
      <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-gray-600">
        Recordatorios automáticos los días 1, 5 y 15 del mes. Mora tras {form.dias_gracia || 5} días de retraso.
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
        {loading ? 'Guardando...' : '✓ Finalizar configuración'}
      </button>
      <button type="button" onClick={onFinish} className="w-full text-sm text-gray-400 py-2">Configurar luego</button>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function NuevoCondominioPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [condominioId, setCondominioId] = useState<string | null>(null)

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>
      <ProgressBar step={step} />
      {step === 1 && <PasoInfo onNext={id => { setCondominioId(id); setStep(2) }} />}
      {step === 2 && condominioId && <PasoPropietarios condominioId={condominioId} onNext={() => setStep(3)} />}
      {step === 3 && condominioId && <PasoCuotas condominioId={condominioId} onFinish={() => router.push(`/condominios/${condominioId}`)} />}
    </div>
  )
}
