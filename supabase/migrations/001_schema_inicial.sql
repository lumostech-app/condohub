-- CondoHub — Migración inicial completa
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: admins
-- ============================================================
CREATE TABLE admins (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  email            text UNIQUE NOT NULL,
  telefono         text UNIQUE NOT NULL,
  plan             text NOT NULL DEFAULT 'mini' CHECK (plan IN ('mini','basico','starter','pro','business')),
  plan_status      text NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('trial','active','suspended','cancelled')),
  trial_ends_at    timestamptz DEFAULT (now() + interval '14 days'),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_own" ON admins
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_update_own" ON admins
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TABLA: condominios
-- ============================================================
CREATE TABLE condominios (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  direccion        text,
  tipo             text NOT NULL CHECK (tipo IN ('residencial_multi','edificio_solo','casas')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_condominios" ON condominios
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: edificios
-- ============================================================
CREATE TABLE edificios (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  niveles          int NOT NULL DEFAULT 1,
  tiene_sotano     boolean NOT NULL DEFAULT false
);

ALTER TABLE edificios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_edificios" ON edificios
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: unidades
-- ============================================================
CREATE TABLE unidades (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  edificio_id      uuid REFERENCES edificios(id) ON DELETE SET NULL,
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  codigo           text NOT NULL,
  tipo             text NOT NULL DEFAULT 'apartamento' CHECK (tipo IN ('apartamento','casa','sotano')),
  piso             int,
  metros_cuadrados decimal(10,2),
  parqueos         int NOT NULL DEFAULT 0,
  UNIQUE (condominio_id, codigo)
);

ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_unidades" ON unidades
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: propietarios
-- ============================================================
CREATE TABLE propietarios (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  cedula           text,
  telefono         text,
  email            text,
  unidad_id        uuid REFERENCES unidades(id) ON DELETE SET NULL
);

ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_propietarios" ON propietarios
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: inquilinos
-- ============================================================
CREATE TABLE inquilinos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  telefono         text,
  email            text,
  unidad_id        uuid REFERENCES unidades(id) ON DELETE SET NULL,
  activo           boolean NOT NULL DEFAULT true
);

ALTER TABLE inquilinos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_inquilinos" ON inquilinos
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: config_cuotas
-- ============================================================
CREATE TABLE config_cuotas (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  monto_base       decimal(10,2) NOT NULL,
  dias_gracia      int NOT NULL DEFAULT 5,
  porcentaje_mora  decimal(5,2) NOT NULL DEFAULT 5,
  bloqueo_reservas boolean NOT NULL DEFAULT true,
  dia_cobro        int NOT NULL DEFAULT 1 CHECK (dia_cobro BETWEEN 1 AND 28),
  UNIQUE (condominio_id)
);

ALTER TABLE config_cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_config_cuotas" ON config_cuotas
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: cuotas
-- ============================================================
CREATE TABLE cuotas (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  unidad_id        uuid NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  mes              int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio             int NOT NULL,
  monto_base       decimal(10,2) NOT NULL,
  mora_acumulada   decimal(10,2) NOT NULL DEFAULT 0,
  total_debido     decimal(10,2) NOT NULL,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','moroso','bloqueado')),
  fecha_limite     date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidad_id, mes, anio)
);

ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_cuotas" ON cuotas
  FOR ALL USING (auth.uid() = admin_id);

CREATE INDEX idx_cuotas_condominio_mes ON cuotas (condominio_id, mes, anio);
CREATE INDEX idx_cuotas_estado ON cuotas (estado, admin_id);

-- ============================================================
-- TABLA: pagos
-- ============================================================
CREATE TABLE pagos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  cuota_id         uuid NOT NULL REFERENCES cuotas(id) ON DELETE CASCADE,
  unidad_id        uuid NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  monto            decimal(10,2) NOT NULL,
  fecha_pago       date NOT NULL,
  metodo           text NOT NULL DEFAULT 'transferencia' CHECK (metodo IN ('transferencia','efectivo','cheque')),
  banco            text,
  referencia       text,
  comprobante_url  text,
  registrado_por   text NOT NULL DEFAULT 'admin' CHECK (registrado_por IN ('admin','residente','sistema')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pagos" ON pagos
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: gastos
-- ============================================================
CREATE TABLE gastos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  categoria        text NOT NULL CHECK (categoria IN ('empleado','proveedor','luz','agua','gas','mantenimiento','otro')),
  descripcion      text NOT NULL,
  monto            decimal(10,2) NOT NULL,
  fecha            date NOT NULL,
  proveedor_nombre text,
  comprobante_url  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_gastos" ON gastos
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: areas_comunes
-- ============================================================
CREATE TABLE areas_comunes (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id             uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  condominio_id        uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre               text NOT NULL,
  capacidad            int,
  hora_apertura        time,
  hora_cierre          time,
  requiere_aprobacion  boolean NOT NULL DEFAULT true,
  activa               boolean NOT NULL DEFAULT true
);

ALTER TABLE areas_comunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_areas_comunes" ON areas_comunes
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: reservaciones
-- ============================================================
CREATE TABLE reservaciones (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  area_id          uuid NOT NULL REFERENCES areas_comunes(id) ON DELETE CASCADE,
  unidad_id        uuid NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  fecha            date NOT NULL,
  hora_inicio      time NOT NULL,
  hora_fin         time NOT NULL,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_reservaciones" ON reservaciones
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: empleados
-- ============================================================
CREATE TABLE empleados (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  cargo            text,
  salario          decimal(10,2),
  activo           boolean NOT NULL DEFAULT true
);

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_empleados" ON empleados
  FOR ALL USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: whatsapp_conversaciones
-- ============================================================
CREATE TABLE whatsapp_conversaciones (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefono         text NOT NULL UNIQUE,
  admin_id         uuid REFERENCES admins(id) ON DELETE SET NULL,
  tipo_usuario     text CHECK (tipo_usuario IN ('admin','residente','desconocido')),
  ultimo_mensaje   timestamptz,
  contexto         jsonb
);

ALTER TABLE whatsapp_conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_conversaciones" ON whatsapp_conversaciones
  FOR SELECT USING (auth.uid() = admin_id);

-- ============================================================
-- TABLA: whatsapp_plantillas
-- ============================================================
CREATE TABLE whatsapp_plantillas (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           text NOT NULL UNIQUE,
  tipo             text CHECK (tipo IN ('recordatorio_cuota','mora','bloqueo','confirmacion_pago')),
  contenido        text NOT NULL,
  aprobada_meta    boolean NOT NULL DEFAULT false
);

-- Plantillas por defecto
INSERT INTO whatsapp_plantillas (nombre, tipo, contenido) VALUES
  ('recordatorio_cuota_dia1', 'recordatorio_cuota',
   'Hola {{nombre}}, le recordamos que la cuota de {{mes}} del {{condominio}} por RD${{monto}} está pendiente. Envíe su comprobante directamente a este número.'),
  ('recordatorio_cuota_dia5', 'recordatorio_cuota',
   'Hola {{nombre}}, su cuota de {{mes}} del {{condominio}} por RD${{monto}} aún está pendiente. Tiene hasta el día {{fecha_limite}} antes de incurrir en mora.'),
  ('aviso_mora_dia15', 'mora',
   'Hola {{nombre}}, su cuota de {{mes}} tiene mora acumulada. Total actual: RD${{total}}. Contáctese con su administrador.');

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cuotas_updated_at
  BEFORE UPDATE ON cuotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil admin al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admins (id, nombre, email, telefono)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
