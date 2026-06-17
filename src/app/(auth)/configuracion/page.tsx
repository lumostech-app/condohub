'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLAN_LIMITES, PLAN_PRECIOS_USD } from '@/types'

interface Admin {
  id: string
  nombre: string
  email: string
  telefono: string | null
  plan: string
  plan_status: string
  trial_ends_at: string | null
  plan_paid_until: string | null
}

export default function ConfiguracionPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    const res = await fetch('/api/admins/profile')
    const data = await res.json()
    setAdmin(data.admin ?? null)
    if (data.admin) {
      setForm({ nombre: data.admin.nombre ?? '', telefono: data.admin.telefono ?? '' })
    }
  }

  useEffect(() => { cargar() }, [])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await fetch('/api/admins/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setGuardando(false)

    if (!res.ok) { setError(data.error); return }
    setAdmin(data.admin)
    setEditando(false)
    setExito(true)
    setTimeout(() => setExito(false), 3000)
  }

  const plan = admin?.plan as keyof typeof PLAN_LIMITES
  const limites = plan && plan in PLAN_LIMITES ? PLAN_LIMITES[plan] : null

  if (!admin) {
    return (
      <main className="max-w-5xl mx-auto">
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Mi cuenta</h1>

      {exito && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          ✓ Perfil actualizado correctamente
        </div>
      )}

      {/* Datos del perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="text-xs text-blue-600 font-medium"
            >
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form onSubmit={guardar} className="space-y-3">
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold">Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold">WhatsApp</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="809-555-0000"
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold">Email</label>
              <p className="text-gray-500 text-sm mt-1">{admin.email} <span className="text-gray-300">(no editable)</span></p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setEditando(false); setForm({ nombre: admin.nombre, telefono: admin.telefono ?? '' }) }}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Nombre</p>
              <p className="text-gray-900 mt-1">{admin.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Email</p>
              <p className="text-gray-900 mt-1">{admin.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">WhatsApp</p>
              <p className="text-gray-900 mt-1">{admin.telefono ?? <span className="text-gray-400">No registrado</span>}</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase font-semibold">Plan actual</p>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            {admin.plan === 'plus' ? 'Básico+' : admin.plan === 'basico' ? 'Básico' : 'Gratis'}
          </span>
        </div>
        {limites && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Condominios</p>
              <p className="font-semibold text-gray-900">Hasta {limites.condominios}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Unidades</p>
              <p className="font-semibold text-gray-900">Hasta {limites.unidades}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Estado: <span className="capitalize font-medium text-gray-600">{admin.plan_status}</span>
          {admin.trial_ends_at && admin.plan_status === 'trial' && (
            <> · Trial hasta {new Date(admin.trial_ends_at).toLocaleDateString('es-DO')}</>
          )}
          {admin.plan_paid_until && admin.plan_status === 'active' && (
            <> · Activo hasta {new Date(admin.plan_paid_until).toLocaleDateString('es-DO')}</>
          )}
        </p>
        <Link
          href="/suscripcion"
          className="mt-3 block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {admin.plan_status === 'active' ? 'Renovar suscripción' : 'Pagar suscripción'} · ${PLAN_PRECIOS_USD[admin.plan as keyof typeof PLAN_PRECIOS_USD] ?? '?'} USD/mes
        </Link>
      </div>

      {/* Cambiar contraseña */}
      <CambiarContrasena />

      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}

function CambiarContrasena() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (form.nueva !== form.confirmar) { setMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden.' }); return }
    if (form.nueva.length < 8) { setMsg({ tipo: 'error', texto: 'Mínimo 8 caracteres.' }); return }

    setLoading(true)
    setMsg(null)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: form.nueva })
    setLoading(false)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }
    setMsg({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' })
    setForm({ nueva: '', confirmar: '' })
    setTimeout(() => { setOpen(false); setMsg(null) }, 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Contraseña</h2>
        <button onClick={() => { setOpen(o => !o); setMsg(null) }} className="text-xs text-blue-600 font-medium">
          {open ? 'Cancelar' : 'Cambiar'}
        </button>
      </div>

      {!open && (
        <p className="text-sm text-gray-400 mt-1">••••••••</p>
      )}

      {open && (
        <form onSubmit={guardar} className="mt-4 space-y-3">
          {msg && (
            <p className={`text-sm px-3 py-2 rounded-xl ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.texto}
            </p>
          )}
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.nueva}
              onChange={e => setForm(p => ({ ...p, nueva: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Confirmar contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmar}
              onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repite la contraseña"
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      )}
    </div>
  )
}
