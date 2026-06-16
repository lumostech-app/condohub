'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITES } from '@/types'

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') as keyof typeof PLAN_LIMITES | null
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    plan: (planParam && planParam in PLAN_LIMITES ? planParam : 'gratis') as keyof typeof PLAN_LIMITES,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          telefono: form.telefono,
          plan: form.plan,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/verificar-email')
  }

  const PLANES = [
    { id: 'gratis',   label: 'Gratis',   desc: '1 condo / 10 unidades',    precio: 'Gratis' },
    { id: 'mini',     label: 'Mini',     desc: '1 condo / 10 unidades',    precio: 'RD$990/mes' },
    { id: 'basico',   label: 'Básico',   desc: '1 condo / 30 unidades',    precio: 'RD$1,490/mes' },
    { id: 'starter',  label: 'Starter',  desc: '3 condos / 80 unidades',   precio: 'RD$2,500/mes' },
    { id: 'pro',      label: 'Pro',      desc: '8 condos / 250 unidades',  precio: 'RD$4,500/mes' },
    { id: 'business', label: 'Business', desc: '20 condos / 600 unidades', precio: 'RD$7,500/mes' },
  ]

  const esGratis = form.plan === 'gratis'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CondoHub</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {esGratis ? 'Plan gratuito · Sin tarjeta · Sin pagos' : '14 días gratis, sin tarjeta de crédito'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              name="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              name="telefono"
              type="tel"
              required
              value={form.telefono}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="809-555-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <div className="space-y-2">
              {PLANES.map(plan => {
                const selected = form.plan === plan.id
                const isGratis = plan.id === 'gratis'
                return (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                      selected && isGratis ? 'border-green-500 bg-green-50' :
                      selected ? 'border-blue-500 bg-blue-50' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selected}
                        onChange={handleChange}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {plan.label}
                          {isGratis && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Recomendado</span>}
                        </p>
                        <p className="text-xs text-gray-500">{plan.desc}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${isGratis ? 'text-green-600' : 'text-gray-700'}`}>{plan.precio}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              esGratis
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Creando cuenta...' : esGratis ? 'Crear cuenta gratis' : 'Comenzar prueba gratis'}
          </button>

          <p className="text-xs text-center text-gray-400">
            {esGratis
              ? 'Plan gratuito permanente. Sin cobros, sin tarjeta de crédito.'
              : 'Al registrarte aceptas nuestros términos de servicio. El cobro es manual por transferencia bancaria.'}
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
