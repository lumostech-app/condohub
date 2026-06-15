import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'

const ESTADO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pagado:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Pagada ✓'   },
  pendiente: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendiente'  },
  moroso:    { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Con mora ⚠️' },
  bloqueado: { bg: 'bg-gray-100',  text: 'text-gray-600',   label: 'Bloqueada'  },
}

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function ResidentePortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/residentes/login')

  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  // Buscar propietario por email usando service role (bypass RLS)
  const admin = createAdminClient()

  const { data: propietario } = await admin
    .from('propietarios')
    .select('id, nombre, unidad_id, admin_id, unidades(codigo, condominio_id, condominios(nombre))')
    .eq('email', user.email!)
    .single()

  // Si no está registrado como propietario
  if (!propietario || !propietario.unidad_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <div className="text-4xl">🔍</div>
            <h1 className="font-bold text-gray-900">No encontramos tu cuenta</h1>
            <p className="text-sm text-gray-500">
              El email <strong>{user.email}</strong> no está registrado en ningún condominio.
              Pídele a tu administrador que lo agregue en la sección de Propietarios.
            </p>
          </div>
          <form action="/api/auth/logout" method="POST" className="mt-4">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  const unidad = propietario.unidades as unknown as {
    codigo: string
    condominio_id: string
    condominios: { nombre: string }
  }
  const condominioNombre = unidad?.condominios?.nombre ?? 'Tu condominio'

  // Cuota del mes actual
  const { data: cuotaMes } = await admin
    .from('cuotas')
    .select('*')
    .eq('unidad_id', propietario.unidad_id)
    .eq('mes', mes)
    .eq('anio', anio)
    .single()

  // Historial de los últimos 6 meses
  const { data: historial } = await admin
    .from('cuotas')
    .select('mes, anio, estado, total_debido, monto_base, mora_acumulada, fecha_limite')
    .eq('unidad_id', propietario.unidad_id)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(6)

  // Último pago registrado
  const { data: ultimoPago } = await admin
    .from('pagos')
    .select('monto, fecha_pago, banco, referencia')
    .eq('unidad_id', propietario.unidad_id)
    .order('fecha_pago', { ascending: false })
    .limit(1)
    .single()

  const cuotaEstilo = cuotaMes ? (ESTADO_STYLES[cuotaMes.estado] ?? ESTADO_STYLES.pendiente) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{condominioNombre}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              Hola, {propietario.nombre.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Unidad {unidad?.codigo}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600 mt-1">
              Salir
            </button>
          </form>
        </div>

        {/* Cuota del mes */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Cuota {MESES[mes]} {anio}
          </h2>

          {cuotaMes && cuotaEstilo ? (
            <div className={`${cuotaEstilo.bg} rounded-2xl p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(cuotaMes.total_debido)}</p>
                  {cuotaMes.mora_acumulada > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Incluye mora: {formatCurrency(cuotaMes.mora_acumulada)}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 ${cuotaEstilo.text}`}>
                  {cuotaEstilo.label}
                </span>
              </div>

              {cuotaMes.estado !== 'pagado' && cuotaMes.fecha_limite && (
                <p className="text-xs text-gray-600">
                  Fecha límite: <strong>{new Date(cuotaMes.fecha_limite + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })}</strong>
                </p>
              )}

              {cuotaMes.estado !== 'pagado' && (
                <div className="mt-4 bg-white/50 rounded-xl p-3">
                  <p className="text-xs text-gray-700 font-medium mb-1">¿Cómo pagar?</p>
                  <p className="text-xs text-gray-600">
                    Envía la foto de tu comprobante de transferencia por WhatsApp al número de tu administrador y quedará registrado automáticamente.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-gray-400 text-sm">Cuota de {MESES[mes]} aún no generada</p>
              <p className="text-xs text-gray-400 mt-1">Se genera automáticamente el 1ro de cada mes</p>
            </div>
          )}
        </section>

        {/* Último pago */}
        {ultimoPago && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Último pago registrado
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">{formatCurrency(ultimoPago.monto)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(ultimoPago.fecha_pago + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {ultimoPago.banco && ` · ${ultimoPago.banco}`}
                </p>
              </div>
              <span className="text-green-500 text-lg">✓</span>
            </div>
          </section>
        )}

        {/* Historial */}
        {(historial?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Historial
            </h2>
            <div className="space-y-2">
              {(historial ?? []).map(c => {
                const estilo = ESTADO_STYLES[c.estado] ?? ESTADO_STYLES.pendiente
                return (
                  <div key={`${c.mes}-${c.anio}`} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {MESES[c.mes]} {c.anio}
                      </p>
                      {c.mora_acumulada > 0 && (
                        <p className="text-xs text-red-500 mt-0.5">Mora: {formatCurrency(c.mora_acumulada)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(c.total_debido)}</p>
                      <span className={`text-xs font-medium ${estilo.text}`}>{estilo.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
