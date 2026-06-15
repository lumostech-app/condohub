-- ============================================================
-- MIGRACIÓN 003: PayPal + columnas faltantes
-- Ejecutar después de 002_fixes_y_storage.sql
-- ============================================================

-- Columnas de suscripción PayPal en admins
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS plan_paid_until   timestamptz,
  ADD COLUMN IF NOT EXISTS paypal_payer_id   text;

-- Descripción en condominios (usada por /editar)
ALTER TABLE condominios
  ADD COLUMN IF NOT EXISTS descripcion text;

-- Tabla de pagos de suscripción (historial)
CREATE TABLE IF NOT EXISTS pagos_suscripcion (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id         uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  paypal_order_id  text NOT NULL,
  plan             text NOT NULL,
  monto_usd        decimal(10,2) NOT NULL,
  estado           text NOT NULL DEFAULT 'completado',
  paid_until       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pagos_suscripcion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_own_pagos_suscripcion" ON pagos_suscripcion
  FOR SELECT USING (auth.uid() = admin_id);

-- Índice para buscar por orden PayPal
CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion_order ON pagos_suscripcion (paypal_order_id);
