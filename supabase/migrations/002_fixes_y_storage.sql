-- ============================================================
-- MIGRACIÓN 002: Fixes al trigger de registro + Storage
-- Ejecutar después de 001_schema_inicial.sql
-- ============================================================

-- Fix: trigger handle_new_user con teléfono y plan desde metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admins (id, nombre, email, telefono, plan)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre', ''), 'Sin nombre'),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'telefono', ''),
      'pending_' || NEW.id::text
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'plan', ''),
      'mini'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE: Bucket para comprobantes de pago
-- (Ejecutar en Supabase Dashboard > Storage o con este SQL)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprobantes',
  'comprobantes',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Política: admins pueden subir sus propios comprobantes
CREATE POLICY "admins_upload_comprobantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprobantes'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: admins pueden ver sus propios comprobantes
CREATE POLICY "admins_read_comprobantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprobantes'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: service role puede leer todos (para el bot de WhatsApp)
CREATE POLICY "service_role_read_comprobantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprobantes'
    AND auth.role() = 'service_role'
  );

-- ============================================================
-- ÍNDICES ADICIONALES para queries frecuentes del bot
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_admins_telefono ON admins (telefono);
CREATE INDEX IF NOT EXISTS idx_propietarios_telefono ON propietarios (telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_telefono ON whatsapp_conversaciones (telefono);
CREATE INDEX IF NOT EXISTS idx_cuotas_pendientes ON cuotas (estado, condominio_id, mes, anio) WHERE estado != 'pagado';
