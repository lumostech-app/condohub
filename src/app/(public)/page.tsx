import Link from 'next/link'

const FEATURES = [
  {
    icon: '📱',
    title: 'Operación 100% por WhatsApp',
    desc: 'Registra pagos, gastos y consulta morosos sin abrir ninguna app. Solo escribe o envía una foto.',
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
    title: 'Reporte mensual en segundos',
    desc: 'Escribe "reporte" y recibe el resumen completo listo para compartir con la junta.',
  },
  {
    icon: '🏢',
    title: 'Multi-condominio',
    desc: 'Administra todos tus condominios desde un solo número. Cambia entre ellos con un mensaje.',
  },
  {
    icon: '🔒',
    title: 'Datos 100% seguros',
    desc: 'Cada administrador ve solo sus propios condominios. Aislamiento total de datos.',
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
        <div className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Diseñado para República Dominicana
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Administra tu condominio<br className="hidden sm:block" />
          <span className="text-blue-600"> desde WhatsApp</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          CondoHub digitaliza la operación de condominios en RD.
          Sin formularios. Sin hojas de cálculo. Solo WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Comenzar gratis — 14 días
          </Link>
          <Link
            href="/precios"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Ver planes y precios
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-3">Sin tarjeta de crédito · Cobro manual por transferencia</p>
      </section>

      {/* Chat preview */}
      <section className="max-w-sm mx-auto px-4 mb-20">
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
        <p className="text-center text-xs text-gray-400 mt-3">Así funciona el registro de pagos</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Todo lo que necesitas, sin lo que no
        </h2>
        <p className="text-gray-500 text-center mb-10 text-sm">Enfocado en la operación diaria del síndico dominicano</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-5">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Propuesta de valor por perfil */}
      <section className="bg-gray-50 py-16 mb-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Para cada tipo de administrador</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Síndico voluntario</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'Deja de perseguir morosos personalmente',
                  'El sistema manda los recordatorios, no tú',
                  'Residentes envían comprobantes directo al bot',
                  'Reporte mensual automático para la junta',
                  '"No fui yo, fue el sistema"',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400">Plan Mini desde <strong className="text-gray-700">RD$990/mes</strong></p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Administrador profesional</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'Opera múltiples condominios desde WhatsApp',
                  'Cero formularios, todo lenguaje natural',
                  'Visión consolidada de todos tus condominios',
                  'Clientes impresionados con tecnología de punta',
                  'Escala sin contratar más personal',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400">Plan Starter desde <strong className="text-gray-700">RD$2,500/mes</strong></p>
              </div>
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
          14 días gratis, sin tarjeta de crédito. Configura tu primer condominio en menos de 5 minutos.
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
