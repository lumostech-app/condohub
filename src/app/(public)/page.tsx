import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CondoHub — Panel de administración de condominios en RD',
  description: 'El panel web completo para administrar condominios en República Dominicana. Cuotas, pagos, morosos y reportes en una plataforma profesional. WhatsApp integrado.',
  openGraph: {
    title: 'CondoHub — Panel de administración de condominios en RD',
    description: 'Cuotas, pagos, morosos y reportes en un panel web profesional. WhatsApp integrado para notificaciones y comandos rápidos.',
    locale: 'es_DO',
    type: 'website',
  },
}

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Panel web completo',
    desc: 'Dashboard con KPIs, gestión de cuotas, pagos, gastos, propietarios e inquilinos. Todo en un panel profesional diseñado para el síndico dominicano.',
    highlight: true,
  },
  {
    icon: '🤖',
    title: 'IA lee los comprobantes',
    desc: 'Toma foto del comprobante de transferencia. La IA extrae banco, monto y referencia automáticamente.',
  },
  {
    icon: '🔔',
    title: 'Recordatorios automáticos',
    desc: 'El sistema avisa a los residentes los días 1, 5 y 15. Tú no persigues a nadie más.',
  },
  {
    icon: '📊',
    title: 'Reportes en segundos',
    desc: 'Reporte mensual con ingresos, gastos, morosos y saldo. Exporta a Excel con un clic.',
  },
  {
    icon: '🏢',
    title: 'Multi-condominio',
    desc: 'Administra todos tus condominios desde una sola cuenta. Cambia entre ellos en el panel o por WhatsApp.',
  },
  {
    icon: '🔒',
    title: 'Datos 100% seguros',
    desc: 'Cada administrador ve solo sus propios condominios. Aislamiento total de datos con Supabase.',
  },
]

const CHAT_PREVIEW = [
  { from: 'admin', text: 'pago A3', withImage: true },
  { from: 'bot', text: '✅ Encontré en el comprobante:\n📍 Unidad A3 — María González\n💰 RD$3,500\n🏦 Banreservas\n🔢 Ref: 2026051500123\n\n¿Confirmo el pago? (sí/no)' },
  { from: 'admin', text: 'sí' },
  { from: 'bot', text: '✅ Pago registrado. Cuota junio 2026 de A3 marcada como PAGADA' },
]

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Diseñado para República Dominicana
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          El panel completo para<br className="hidden sm:block" />
          <span className="text-blue-600"> administrar condominios</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Cuotas, pagos, morosos y reportes en un panel web profesional.
          WhatsApp integrado para notificaciones y comandos rápidos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Empezar gratis — sin tarjeta
          </Link>
          <Link
            href="/precios"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Ver planes y precios
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-3">Plan gratuito permanente · Planes de pago desde RD$990/mes</p>
      </section>

      {/* Panel preview placeholder / KPI showcase */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="bg-gray-900 rounded-3xl p-6 sm:p-10">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-6">Panel de control</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Recaudado', value: 'RD$142,500', color: 'text-green-400' },
              { label: 'Gastos', value: 'RD$38,200', color: 'text-red-400' },
              { label: 'Saldo neto', value: 'RD$104,300', color: 'text-blue-400' },
              { label: '% Cobro', value: '87%', color: 'text-yellow-400' },
            ].map(k => (
              <div key={k.label} className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs">{k.label}</p>
                <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-semibold">Progreso de cobro — junio 2026</p>
              <p className="text-gray-300 text-xs font-bold">43/50 · 87%</p>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
              <div className="bg-green-500 h-full" style={{ width: '87%' }} />
              <div className="bg-red-500 h-full" style={{ width: '8%' }} />
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-green-500 text-xs font-medium">43 pagadas</span>
              <span className="text-red-400 text-xs font-medium">4 morosas</span>
              <span className="text-yellow-400 text-xs font-medium">3 pendientes</span>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Así se ve tu panel — datos en tiempo real de todos tus condominios</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Todo lo que necesitas, sin lo que no
        </h2>
        <p className="text-gray-500 text-center mb-10 text-sm">Enfocado en la operación diaria del síndico dominicano</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className={`rounded-2xl p-5 ${f.highlight ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
              <span className="text-3xl">{f.icon}</span>
              <h3 className={`font-semibold mt-3 mb-1 text-sm ${f.highlight ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
              <p className={`text-xs leading-relaxed ${f.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp canal complementario */}
      <section className="bg-gray-50 py-16 mb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Canal WhatsApp integrado
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Administra también desde tu teléfono
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Cuando estás fuera de la oficina, el bot de WhatsApp te permite registrar pagos,
              consultar morosos y recibir reportes — sin abrir el panel.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {[
                { icon: '📷', title: 'Registra pagos con foto', desc: 'Envía el comprobante al bot y la IA lo registra automáticamente.' },
                { icon: '📋', title: 'Consulta morosos', desc: 'Escribe "morosos" y recibe la lista de unidades pendientes.' },
                { icon: '💬', title: 'Notifica a residentes', desc: 'El bot avisa de pagos, recordatorios de cuotas y comunicados del condo.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-lg">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-3xl p-4">
              <div className="bg-green-600 rounded-2xl px-4 py-2 text-white text-xs font-medium mb-3 text-center">
                CondoHub WhatsApp Bot
              </div>
              <div className="space-y-3">
                {CHAT_PREVIEW.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      msg.from === 'admin'
                        ? 'bg-green-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {msg.withImage && (
                        <div className="bg-green-400 rounded-lg px-3 py-2 mb-1 text-center text-xs opacity-90">
                          📷 Comprobante.jpg
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfiles */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Para cada tipo de administrador</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Síndico voluntario</p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Panel web claro con todo el estado del condo',
                'El sistema manda recordatorios, tú no persigues',
                'Residentes envían comprobantes al bot',
                'Reporte mensual para la junta en un clic',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400">Desde <strong className="text-gray-700">Gratis</strong> · Sin tarjeta</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Administrador profesional</p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Vista consolidada de todos tus condominios',
                'Panel completo + WhatsApp como canal extra',
                'Gestión de propietarios, inquilinos y empleados',
                'Escala sin contratar más personal',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400">Plan Básico desde <strong className="text-gray-700">RD$990/mes</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-4 text-center mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Empieza hoy mismo
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Plan gratuito permanente. Sin tarjeta de crédito. Configura tu primer condominio en menos de 5 minutos.
        </p>
        <Link
          href="/registro"
          className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Crear cuenta gratis
        </Link>
      </section>
    </main>
  )
}
