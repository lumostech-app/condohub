'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  generarUnidades,
  PRESETS,
  FormatoUnidad,
  EdificioConfig,
  letraEdificio,
} from '@/lib/unidades'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoCondominio = 'residencial_multi' | 'edificio_solo' | 'casas'

interface UnidadPreview {
  id: string
  codigo: string
  piso: number | null
  tipo: 'apartamento' | 'sotano'
}

interface GrupoPreview {
  label: string
  unidades: UnidadPreview[]
}

interface ResidenteImportado {
  unidad_codigo: string
  nombre: string
  cedula: string
  telefono: string
  email: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mkId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function mkEdificios(count: number, udsTotal: number, pisos: number, udsPiso: number): EdificioConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    label: letraEdificio(i + 1),
    pisos,
    unidadesPorPiso: udsPiso,
    unidadesTotal: udsTotal,
  }))
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

// ─── Paso 1: Información ──────────────────────────────────────────────────────

function PasoInfo({ onNext }: { onNext: (id: string) => void }) {
  // Basic info
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [tipo, setTipo] = useState<TipoCondominio>('residencial_multi')

  // Format
  const [presetKey, setPresetKey] = useState('letraNumero')
  const [formato, setFormato] = useState<FormatoUnidad>(PRESETS.letraNumero.formato)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Building structure
  const [numEdificios, setNumEdificios] = useState(2)
  const [gTotal, setGTotal] = useState(4)
  const [gPisos, setGPisos] = useState(2)
  const [gUdsPiso, setGUdsPiso] = useState(2)
  const [edificios, setEdificios] = useState<EdificioConfig[]>(mkEdificios(2, 4, 2, 2))

  // Preview editable
  const [grupos, setGrupos] = useState<GrupoPreview[]>([])
  const [editada, setEditada] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // Save state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esMulti = tipo === 'residencial_multi'
  const esPorPiso = formato.familia === 'porPiso'

  // Auto-regenerate when structure/format changes (unless manually edited)
  useEffect(() => {
    if (editada) return
    const raw = generarUnidades(edificios, formato)
    setGrupos(raw.map(g => ({
      label: g.label,
      unidades: g.unidades.map(u => ({ ...u, id: mkId() })),
    })))
  }, [edificios, formato, editada])

  // ── Tipo change ──

  function handleTipo(t: TipoCondominio) {
    setTipo(t)
    setEditada(false)
    if (t === 'residencial_multi') {
      setEdificios(mkEdificios(numEdificios, gTotal, gPisos, gUdsPiso))
    } else {
      setEdificios([{ label: '', pisos: gPisos, unidadesPorPiso: gUdsPiso, unidadesTotal: gTotal }])
    }
  }

  // ── Building structure ──

  function handleNumEdificios(n: number) {
    const count = Math.max(1, Math.min(26, n))
    setNumEdificios(count)
    setEdificios(prev => {
      if (count > prev.length) {
        const extras = Array.from({ length: count - prev.length }, (_, i) => ({
          label: letraEdificio(prev.length + i + 1),
          pisos: gPisos,
          unidadesPorPiso: gUdsPiso,
          unidadesTotal: gTotal,
        }))
        return [...prev, ...extras]
      }
      return prev.slice(0, count)
    })
  }

  function updateEdificio(i: number, patch: Partial<EdificioConfig>) {
    setEdificios(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  }

  function applyGlobal(key: 'unidadesTotal' | 'pisos' | 'unidadesPorPiso', val: number) {
    if (key === 'unidadesTotal') setGTotal(val)
    if (key === 'pisos') setGPisos(val)
    if (key === 'unidadesPorPiso') setGUdsPiso(val)
    setEdificios(prev => prev.map(e => ({ ...e, [key]: val })))
  }

  // ── Format ──

  function selectPreset(key: string) {
    setPresetKey(key)
    setFormato(PRESETS[key].formato)
  }

  function updateFormato(patch: Partial<FormatoUnidad>) {
    setFormato(prev => {
      const next = { ...prev, ...patch }
      if ('piso' in patch) {
        next.familia = patch.piso === 'numero' ? 'porPiso' : 'porEdificio'
      }
      const found = Object.entries(PRESETS).find(([, p]) =>
        JSON.stringify(p.formato) === JSON.stringify(next)
      )
      setPresetKey(found ? found[0] : 'custom')
      return next
    })
  }

  // ── Preview editing ──

  function startEdit(id: string, codigo: string) {
    setEditingId(id)
    setEditingValue(codigo)
  }

  function saveEdit() {
    if (!editingId) return
    const val = editingValue.trim().toUpperCase()
    if (val) {
      setGrupos(prev => prev.map(g => ({
        ...g,
        unidades: g.unidades.map(u => u.id === editingId ? { ...u, codigo: val } : u),
      })))
      setEditada(true)
    } else {
      // empty → remove the unit
      setGrupos(prev => prev.map(g => ({
        ...g,
        unidades: g.unidades.filter(u => u.id !== editingId),
      })))
      setEditada(true)
    }
    setEditingId(null)
  }

  function cancelEdit() {
    // If the unit has no code (was just added), remove it
    setGrupos(prev => prev.map(g => ({
      ...g,
      unidades: g.unidades.filter(u => !(u.id === editingId && !u.codigo)),
    })))
    setEditingId(null)
  }

  function removeUnidad(groupLabel: string, id: string) {
    setGrupos(prev => prev.map(g =>
      g.label === groupLabel
        ? { ...g, unidades: g.unidades.filter(u => u.id !== id) }
        : g
    ))
    setEditada(true)
  }

  function addUnidad(groupLabel: string) {
    const newId = mkId()
    setGrupos(prev => prev.map(g =>
      g.label === groupLabel
        ? { ...g, unidades: [...g.unidades, { id: newId, codigo: '', piso: null, tipo: 'apartamento' }] }
        : g
    ))
    setEditada(true)
    setEditingId(newId)
    setEditingValue('')
  }

  // ── Submit ──

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido'); return }

    const totalValidas = grupos.reduce((s, g) => s + g.unidades.filter(u => u.codigo.trim()).length, 0)
    if (totalValidas === 0) { setError('Agrega al menos una unidad'); return }

    setLoading(true)
    setError(null)

    const edificiosData = grupos.map((g, gi) => ({
      nombre: esMulti ? `Edificio ${g.label}` : nombre.trim(),
      niveles: esPorPiso ? (edificios[gi]?.pisos ?? 1) : 1,
      tiene_sotano: g.unidades.some(u => u.tipo === 'sotano'),
      unidades: g.unidades
        .filter(u => u.codigo.trim())
        .map(u => ({ codigo: u.codigo.trim().toUpperCase(), piso: u.piso, tipo: u.tipo })),
    }))

    const estructura = {
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      tipo,
      edificios: edificiosData,
      total_unidades: edificiosData.reduce((s, e) => s + e.unidades.length, 0),
    }

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

  const totalUnidades = grupos.reduce((s, g) => s + g.unidades.filter(u => u.codigo.trim()).length, 0)

  return (
    <form onSubmit={guardar} className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nuevo condominio</h1>
        <p className="text-sm text-gray-500">Completa la información básica para empezar</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* ── Información básica ── */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del condominio</label>
          <input
            type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Residencial Madrigal I"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dirección <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text" value={direccion} onChange={e => setDireccion(e.target.value)}
            placeholder="Ej: Av. Carlos Pérez Ricart, Santo Domingo"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de propiedad</label>
          <select
            value={tipo} onChange={e => handleTipo(e.target.value as TipoCondominio)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="residencial_multi">Residencial (varios edificios)</option>
            <option value="edificio_solo">Edificio único</option>
            <option value="casas">Urbanización / casas</option>
          </select>
        </div>
      </div>

      {/* ── Numeración (presets) ── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">¿Cómo se numeran las unidades?</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const sample = generarUnidades(
              [{ label: edificios[0]?.label || 'A', pisos: Math.min(edificios[0]?.pisos || 2, 2), unidadesPorPiso: Math.min(edificios[0]?.unidadesPorPiso || 2, 2), unidadesTotal: Math.min(edificios[0]?.unidadesTotal || 4, 3) }],
              preset.formato,
            ).flatMap(g => g.unidades.map(u => u.codigo)).slice(0, 4).join(', ')

            return (
              <button
                key={key} type="button"
                onClick={() => selectPreset(key)}
                className={`text-left p-3 rounded-xl border-2 transition-colors ${
                  presetKey === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{preset.label}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{sample || preset.ejemplo}</p>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen(p => !p)}
          className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors"
        >
          <span>{advancedOpen ? '▾' : '▸'}</span> Formato avanzado
        </button>

        {advancedOpen && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Edificio</label>
              <select
                value={formato.edificio}
                onChange={e => updateFormato({ edificio: e.target.value as FormatoUnidad['edificio'] })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ninguno">Ninguno</option>
                <option value="letra">Letra</option>
                <option value="numero">Número</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Piso</label>
              <select
                value={formato.piso}
                onChange={e => updateFormato({ piso: e.target.value as FormatoUnidad['piso'] })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ninguno">Ninguno</option>
                <option value="numero">Número</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unidad</label>
              <select
                value={formato.unidad}
                onChange={e => updateFormato({ unidad: e.target.value as FormatoUnidad['unidad'] })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="numero">Número (1, 2…)</option>
                <option value="numeroCero">Núm. con cero (01, 02…)</option>
                <option value="letra">Letra (A, B…)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Estructura ── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Estructura</p>

        {/* Multi: global controls */}
        {esMulti && (
          <div className={`grid gap-3 ${esPorPiso ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Edificios</label>
              <input
                type="number" min="1" max="26" value={numEdificios}
                onChange={e => handleNumEdificios(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {!esPorPiso ? (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Aptos por edificio</label>
                <input
                  type="number" min="1" max="200" value={gTotal}
                  onChange={e => applyGlobal('unidadesTotal', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pisos</label>
                  <input
                    type="number" min="1" max="99" value={gPisos}
                    onChange={e => applyGlobal('pisos', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uds/piso</label>
                  <input
                    type="number" min="1" max="50" value={gUdsPiso}
                    onChange={e => applyGlobal('unidadesPorPiso', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Solo/Casas: inline controls */}
        {!esMulti && (
          <div className={`grid gap-3 ${esPorPiso ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Prefijo <span className="text-gray-300">(opcional)</span>
              </label>
              <input
                type="text" maxLength={6} value={edificios[0]?.label ?? ''}
                onChange={e => updateEdificio(0, { label: e.target.value.toUpperCase() })}
                placeholder={tipo === 'casas' ? 'Casa' : 'Apto'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {!esPorPiso ? (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {tipo === 'casas' ? 'Número de casas' : 'Número de unidades'}
                </label>
                <input
                  type="number" min="1" max="999" value={edificios[0]?.unidadesTotal ?? 4}
                  onChange={e => updateEdificio(0, { unidadesTotal: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pisos</label>
                  <input
                    type="number" min="1" max="99" value={edificios[0]?.pisos ?? 2}
                    onChange={e => updateEdificio(0, { pisos: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uds/piso</label>
                  <input
                    type="number" min="1" max="50" value={edificios[0]?.unidadesPorPiso ?? 2}
                    onChange={e => updateEdificio(0, { unidadesPorPiso: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Multi: per-edificio table */}
        {esMulti && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500">Edificio</th>
                  {!esPorPiso ? (
                    <th className="px-3 py-2 text-xs font-semibold text-gray-500">Aptos</th>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500">Pisos</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500">Uds/piso</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {edificios.map((ed, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">
                      <input
                        type="text" maxLength={4} value={ed.label}
                        onChange={e => updateEdificio(i, { label: e.target.value.toUpperCase() })}
                        className="w-12 px-2 py-1 border border-gray-200 rounded-lg text-sm font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    {!esPorPiso ? (
                      <td className="px-3 py-1.5">
                        <input
                          type="number" min="1" max="200" value={ed.unidadesTotal}
                          onChange={e => updateEdificio(i, { unidadesTotal: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-1.5">
                          <input
                            type="number" min="1" max="99" value={ed.pisos}
                            onChange={e => updateEdificio(i, { pisos: parseInt(e.target.value) || 1 })}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number" min="1" max="50" value={ed.unidadesPorPiso}
                            onChange={e => updateEdificio(i, { unidadesPorPiso: parseInt(e.target.value) || 1 })}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => handleNumEdificios(numEdificios + 1)}
                className="text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                + Edificio
              </button>
              {numEdificios > 1 && (
                <button
                  type="button"
                  onClick={() => handleNumEdificios(numEdificios - 1)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  − Quitar último
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Vista previa editable ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            Vista previa ·{' '}
            <span className="text-blue-600 font-normal">{totalUnidades} unidades</span>
          </p>
          {editada && (
            <button
              type="button"
              onClick={() => setEditada(false)}
              className="text-xs text-orange-500 hover:text-orange-700 font-medium"
            >
              Regenerar (borrará ediciones)
            </button>
          )}
        </div>

        {grupos.map(grupo => (
          <div key={grupo.label} className="border border-gray-200 rounded-xl p-3 space-y-2">
            {esMulti && grupo.label && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Edificio {grupo.label}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 items-center">
              {grupo.unidades.map(u => (
                <div key={u.id} className="flex items-center gap-0 relative">
                  {editingId === u.id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value.toUpperCase())}
                      onBlur={saveEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-16 px-2 py-0.5 border-2 border-blue-400 rounded text-xs font-mono text-center focus:outline-none bg-blue-50"
                    />
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-mono bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700 hover:border-blue-300 transition-colors">
                      <button
                        type="button"
                        onClick={() => startEdit(u.id, u.codigo)}
                        className="hover:text-blue-600"
                      >
                        {u.codigo || '?'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUnidad(grupo.label, u.id)}
                        className="text-gray-300 hover:text-red-400 ml-1 text-sm leading-none"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addUnidad(grupo.label)}
                className="text-xs text-blue-400 border border-dashed border-blue-200 rounded px-2 py-0.5 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors font-mono"
              >
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>

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
            {resultado.errores.map((err, i) => <p key={i} className="text-xs text-gray-600">• {err}</p>)}
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
