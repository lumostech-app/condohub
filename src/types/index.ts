export type Plan = 'mini' | 'basico' | 'starter' | 'pro' | 'business'
export type PlanStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type CondominioTipo = 'residencial_multi' | 'edificio_solo' | 'casas'
export type UnidadTipo = 'apartamento' | 'casa' | 'sotano'
export type CuotaEstado = 'pendiente' | 'pagado' | 'moroso' | 'bloqueado'
export type PagoMetodo = 'transferencia' | 'efectivo' | 'cheque'
export type ReservacionEstado = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'
export type GastoCategoria = 'empleado' | 'proveedor' | 'luz' | 'agua' | 'gas' | 'mantenimiento' | 'otro'
export type RegistradoPor = 'admin' | 'residente' | 'sistema'
export type TipoUsuarioWhatsapp = 'admin' | 'residente' | 'desconocido'
export type PlantillaTipo = 'recordatorio_cuota' | 'mora' | 'bloqueo' | 'confirmacion_pago'

export interface Admin {
  id: string
  nombre: string
  email: string
  telefono: string
  plan: Plan
  plan_status: PlanStatus
  trial_ends_at: string | null
  plan_paid_until: string | null
  paypal_payer_id: string | null
  created_at: string
}

export interface Condominio {
  id: string
  admin_id: string
  nombre: string
  direccion: string | null
  tipo: CondominioTipo
  created_at: string
}

export interface Edificio {
  id: string
  condominio_id: string
  admin_id: string
  nombre: string
  niveles: number
  tiene_sotano: boolean
}

export interface Unidad {
  id: string
  condominio_id: string
  edificio_id: string | null
  admin_id: string
  codigo: string
  tipo: UnidadTipo
  piso: number | null
  metros_cuadrados: number | null
  parqueos: number
}

export interface Propietario {
  id: string
  admin_id: string
  nombre: string
  cedula: string | null
  telefono: string | null
  email: string | null
  unidad_id: string | null
}

export interface Inquilino {
  id: string
  admin_id: string
  nombre: string
  telefono: string | null
  email: string | null
  unidad_id: string | null
  activo: boolean
}

export interface ConfigCuota {
  id: string
  condominio_id: string
  admin_id: string
  monto_base: number
  dias_gracia: number
  porcentaje_mora: number
  bloqueo_reservas: boolean
  dia_cobro: number
}

export interface Cuota {
  id: string
  admin_id: string
  unidad_id: string
  condominio_id: string
  mes: number
  anio: number
  monto_base: number
  mora_acumulada: number
  total_debido: number
  estado: CuotaEstado
  fecha_limite: string | null
  created_at: string
  updated_at: string
}

export interface Pago {
  id: string
  admin_id: string
  cuota_id: string
  unidad_id: string
  monto: number
  fecha_pago: string
  metodo: PagoMetodo
  banco: string | null
  referencia: string | null
  comprobante_url: string | null
  registrado_por: RegistradoPor
  created_at: string
}

export interface Gasto {
  id: string
  admin_id: string
  condominio_id: string
  categoria: GastoCategoria
  descripcion: string
  monto: number
  fecha: string
  proveedor_nombre: string | null
  comprobante_url: string | null
  created_at: string
}

export interface AreaComun {
  id: string
  admin_id: string
  condominio_id: string
  nombre: string
  capacidad: number | null
  hora_apertura: string | null
  hora_cierre: string | null
  requiere_aprobacion: boolean
  activa: boolean
}

export interface Reservacion {
  id: string
  admin_id: string
  area_id: string
  unidad_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: ReservacionEstado
  notas: string | null
  created_at: string
}

export interface Empleado {
  id: string
  admin_id: string
  condominio_id: string
  nombre: string
  cargo: string | null
  salario: number | null
  activo: boolean
}

export interface WhatsappConversacion {
  id: string
  telefono: string
  admin_id: string | null
  tipo_usuario: TipoUsuarioWhatsapp | null
  ultimo_mensaje: string | null
  contexto: Record<string, unknown> | null
}

export interface WhatsappPlantilla {
  id: string
  nombre: string
  tipo: PlantillaTipo | null
  contenido: string
  aprobada_meta: boolean
}

// Precios en USD para cobro por PayPal (aprox. RD$/58)
export const PLAN_PRECIOS_USD: Record<Plan, string> = {
  mini:     '17.00',
  basico:   '25.00',
  starter:  '43.00',
  pro:      '77.00',
  business: '129.00',
}

export const PLAN_LIMITES: Record<Plan, { condominios: number; unidades: number; precio: number }> = {
  mini:     { condominios: 1,  unidades: 10,  precio: 990 },
  basico:   { condominios: 1,  unidades: 30,  precio: 1490 },
  starter:  { condominios: 3,  unidades: 80,  precio: 2500 },
  pro:      { condominios: 8,  unidades: 250, precio: 4500 },
  business: { condominios: 20, unidades: 600, precio: 7500 },
}
