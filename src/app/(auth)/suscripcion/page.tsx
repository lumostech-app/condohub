'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { PLAN_LIMITES, PLAN_PRECIOS_USD } from '@/types'
import type { Plan } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Admin {
  nombre: string
  plan: string
  plan_status: string
  plan_paid_until: string | null
  trial_ends_at: string | null
}

const PLANES_ORDEN: Plan[] = ['gratis', 'mini', 'basico', 'starter', 'pro', 'business']

export default function SuscripcionPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historial, setHistorial] = useState<{ paypal_order_id: string; plan: string; monto_usd: number; paid_until: string; created_at: string }[]>([])

  useEffect(() => {
    fetch('/api/admins/profile')
      .then(r => r.json())
      .then(d => {
        if (d.admin) {
          setAdmin(d.admin)
          setPlanSeleccionado(d.admin.plan as Plan)
        }
      })

    fetch('/api/paypal/historial')
      .then(r => r.json())
      .then(d => setHistorial(d.historial ?? []))
      .catch(() => {/* historial es opcional */})
  }, [])

  if (!admin || !planSeleccionado) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      </main>
    )
  }

  if (exito) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-500 text-sm mb-2">
          Tu suscripción Plan <span className="font-semibold capitalize">{planSeleccionado}</span> está activa por 30 días.
        </p>
        <p className="text-xs text-gray-400 mb-8">Gracias por confiar en CondoHub</p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          Ir al dashboard
        </Link>
      </main>
    )
  }

  const precioUSD = PLAN_PRECIOS_USD[planSeleccionado]
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''
  const planEsGratis = planSeleccionado === 'gratis'

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/configuracion" className="text-sm text-gray-400">‹ Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Suscripción</h1>
      </div>

      {/* Estado actual */}
      <div className={`rounded-2xl p-4 mb-6 ${admin.plan === 'gratis' ? 'bg-green-50' : 'bg-blue-50'}`}>
        <p className={`text-xs font-semibold uppercase mb-1 ${admin.plan === 'gratis' ? 'text-green-500' : 'text-blue-500'}`}>Estado actual</p>
        <p className={`text-sm font-medium capitalize ${admin.plan === 'gratis' ? 'text-green-900' : 'text-blue-900'}`}>
          Plan {admin.plan} · <span className="capitalize">{admin.plan_status}</span>
        </p>
        {admin.plan === 'gratis' && (
          <p className="text-xs text-green-600 mt-1">Plan gratuito permanente · Sin fecha de vencimiento</p>
        )}
        {admin.plan_status === 'trial' && admin.trial_ends_at && (
          <p className="text-xs text-blue-600 mt-1">
            Trial hasta {new Date(admin.trial_ends_at).toLocaleDateString('es-DO')}
          </p>
        )}
        {admin.plan_paid_until && admin.plan_status === 'active' && admin.plan !== 'gratis' && (
          <p className="text-xs text-blue-600 mt-1">
            Activo hasta {new Date(admin.plan_paid_until).toLocaleDateString('es-DO')}
          </p>
        )}
      </div>

      {/* Selector de plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Selecciona tu plan</p>
        <div className="space-y-2">
          {PLANES_ORDEN.map(plan => {
            const l = PLAN_LIMITES[plan]
            const usd = PLAN_PRECIOS_USD[plan]
            const selected = planSeleccionado === plan
            const isGratis = plan === 'gratis'
            return (
              <label
                key={plan}
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
                    value={plan}
                    checked={selected}
                    onChange={() => { setPlanSeleccionado(plan); setError(null) }}
                    className="text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{plan}</p>
                    <p className="text-xs text-gray-400">{l.condominios} condo(s) · {l.unidades} unidades</p>
                  </div>
                </div>
                <div className="text-right">
                  {isGratis ? (
                    <p className="text-sm font-bold text-green-600">Gratis</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-800">${usd} <span className="font-normal text-gray-400 text-xs">USD</span></p>
                      <p className="text-xs text-gray-400">{formatCurrency(l.precio)}</p>
                    </>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Sección de pago — oculta para plan gratis */}
      {planEsGratis ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-green-700 font-semibold text-sm mb-1">Tu plan Gratis está activo</p>
          <p className="text-green-600 text-xs">No necesitas realizar ningún pago. Para acceder a más condominios o unidades, selecciona un plan de pago arriba.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Pagar con PayPal</p>
            <p className="text-lg font-bold text-blue-600">${precioUSD} <span className="text-xs font-normal text-gray-400">USD/mes</span></p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {!paypalClientId ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">PayPal no configurado.</p>
              <p className="text-xs text-gray-300 mt-1">Agrega <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> en las variables de entorno.</p>
            </div>
          ) : (
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}>
              <PayPalButtons
                style={{ layout: 'vertical', label: 'pay', shape: 'rect', color: 'blue' }}
                createOrder={async () => {
                  setError(null)
                  const res = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: planSeleccionado }),
                  })
                  const data = await res.json()
                  if (!res.ok) { setError(data.error ?? 'Error al crear la orden'); throw new Error(data.error) }
                  return data.orderID
                }}
                onApprove={async (data) => {
                  setError(null)
                  const res = await fetch('/api/paypal/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderID: data.orderID }),
                  })
                  const result = await res.json()
                  if (!res.ok) { setError(result.error ?? 'Error al procesar el pago'); return }
                  setExito(true)
                }}
                onError={() => setError('Error al procesar el pago. Intenta de nuevo.')}
                onCancel={() => setError(null)}
              />
            </PayPalScriptProvider>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            Pago seguro procesado por PayPal · Se renueva manualmente cada mes
          </p>
        </div>
      )}

      {/* Historial de pagos */}
      {historial.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Historial de pagos</p>
          <div className="space-y-2">
            {historial.map(p => (
              <div key={p.paypal_order_id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800 capitalize">{p.plan}</p>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('es-DO')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">${p.monto_usd.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">hasta {new Date(p.paid_until).toLocaleDateString('es-DO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
