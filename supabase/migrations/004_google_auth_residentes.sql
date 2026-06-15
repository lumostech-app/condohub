-- Migración 004: Google OAuth para residentes
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. CORREGIR TRIGGER: solo crear admin si el usuario se
--    registró desde el formulario de admins (metadata tiene 'nombre')
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Residentes que se autentican con Google no tienen 'nombre' en metadata
  -- Solo crear registro en admins para usuarios del formulario de registro
  IF NEW.raw_user_meta_data->>'nombre' IS NOT NULL THEN
    INSERT INTO admins (id, nombre, email, telefono)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre',
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'telefono', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. RLS: permitir que residentes lean su propio propietario
--    usando el email de su sesión de Google
-- ============================================================
CREATE POLICY "residente_select_own" ON propietarios
  FOR SELECT
  USING (email = auth.email());

-- ============================================================
-- 3. RLS: residentes pueden leer cuotas de su unidad
-- ============================================================
CREATE POLICY "residente_select_cuotas" ON cuotas
  FOR SELECT
  USING (
    unidad_id IN (
      SELECT unidad_id FROM propietarios
      WHERE email = auth.email()
        AND unidad_id IS NOT NULL
    )
  );

-- ============================================================
-- 4. RLS: residentes pueden leer pagos de su unidad
-- ============================================================
CREATE POLICY "residente_select_pagos" ON pagos
  FOR SELECT
  USING (
    unidad_id IN (
      SELECT unidad_id FROM propietarios
      WHERE email = auth.email()
        AND unidad_id IS NOT NULL
    )
  );

-- ============================================================
-- 5. RLS: residentes pueden leer su unidad
-- ============================================================
CREATE POLICY "residente_select_unidad" ON unidades
  FOR SELECT
  USING (
    id IN (
      SELECT unidad_id FROM propietarios
      WHERE email = auth.email()
        AND unidad_id IS NOT NULL
    )
  );

-- ============================================================
-- 6. RLS: residentes pueden leer el condominio de su unidad
-- ============================================================
CREATE POLICY "residente_select_condominio" ON condominios
  FOR SELECT
  USING (
    id IN (
      SELECT u.condominio_id FROM unidades u
      JOIN propietarios p ON p.unidad_id = u.id
      WHERE p.email = auth.email()
    )
  );
