import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Precios — CondoHub',
  description: 'Planes desde RD$990/mes. Elige el plan ideal para tu condominio. Prueba gratis 14 días sin tarjeta de crédito.',
}

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 990,
    limites: '1 condominio · hasta 40 unidades',
    para: 'Edificio pequeño o mediano',
    features: [
      'Panel web completo',
      'Registro de pagos con IA',
      'Recordatorios automáticos',
      'Reporte mensual',
      'Soporte por WhatsApp',
    ],
    color: 'border-gray-200',
    badge: null,
  },
  {
    id: 'plus',
    nombre: 'Básico+',
    precio: 1490,
    limites: '1 condominio · hasta 100 unidades',
    para: 'Torres y residenciales grandes',
    features: [
      'Todo lo del Básico',
      'Hasta 100 unidades',
      'Importación desde Excel',
      'Histórico de pagos',
      'Gestión de gastos',
    ],
    color: 'border-blue-400 ring-2 ring-blue-100',
    badge: 'Más popular',
  },
]

const FAQ = [
  {
    q: '¿Cómo funciona el cobro?',
    a: 'El cobro es manual por transferencia bancaria en República Dominicana. No necesitas tarjeta de crédito.',
  },
  {
    q: '¿Qué pasa al terminar el trial?',
    a: 'Te contactamos para coordinar el pago. Si no pagas, la cuenta queda suspendida pero tus datos se conservan 30 días.',
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Sí, puedes hacer upgrade en cualquier momento. Si superas el límite de tu plan actual, el sistema te lo indica.',
  },
  {
    q: '¿Mis residentes necesitan instalar algo?',
    a: 'No. Solo usan WhatsApp como siempre. El bot de CondoHub es un número de WhatsApp al que envían sus comprobantes.',
  },
]

export default function PreciosPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Planes y precios</h1>
        <p className="text-gray-500 text-sm">Empieza gratis hoy · Sin tarjeta de crédito</p>
      </div>

      {/* Plan Gratis — destacado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">GRATIS</div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Plan Gratuito</p>
            <p className="text-sm text-gray-500">1 condominio · hasta 10 unidades · Sin límite de tiempo</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ul className="hidden sm:flex flex-col gap-1">
            {['Bot WhatsApp completo', 'Registro de pagos con IA', 'Reporte mensual'].map(f => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="text-green-500 shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>
          <Link
            href="/registro?plan=gratis"
            className="shrink-0 bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>

      {/* Grid de planes de pago */}
      <p className="text-xs text-gray-400 text-center mb-4 uppercase tracking-wide font-medium">Planes de pago — 14 días de prueba gratis</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-16">
        {PLANES.map(plan => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col ${plan.color}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            <div className="mb-4">
              <p className="font-bold text-gray-900 text-lg">{plan.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">{plan.para}</p>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">RD${plan.precio.toLocaleString()}</span>
              <span className="text-xs text-gray-400">/mes</span>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 mb-4 font-medium">
              {plan.limites}
            </p>

            <ul className="space-y-1.5 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`/registro?plan=${plan.id}`}
              className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${
                plan.badge
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Comenzar prueba gratis
            </Link>
          </div>
        ))}
      </div>

      {/* Costos de infraestructura */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-12 max-w-lg mx-auto">
        <p className="text-sm font-semibold text-gray-700 mb-3">Punto de equilibrio</p>
        <div className="space-y-1 text-sm text-gray-600">
          <p>Con <strong>3 clientes Básico</strong> cubres toda la infraestructura</p>
          <p>Con <strong>2 clientes Básico+</strong> cubres toda la infraestructura</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">Margen bruto: 84–92% según el plan</p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {FAQ.map(item => (
            <div key={item.q} className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="font-medium text-gray-900 text-sm mb-2">{item.q}</p>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
