-- Migración 005: Plan gratuito permanente
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. AMPLIAR CHECK CONSTRAINT: agregar 'gratis' a los planes
--    válidos en la tabla admins
-- ============================================================
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_plan_check;
ALTER TABLE admins ADD CONSTRAINT admins_plan_check
  CHECK (plan IN ('gratis','mini','basico','starter','pro','business'));

-- ============================================================
-- 2. ACTUALIZAR TRIGGER: incluir plan y plan_status desde
--    metadata. Si el plan es 'gratis', activar directamente
--    (sin trial). Para los demás planes, el flujo de trial
--    sigue igual.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan text;
BEGIN
  -- Solo crear registro en admins para usuarios del formulario
  -- de registro (tienen 'nombre' en metadata).
  -- Residentes con Google OAuth no tienen 'nombre'.
  IF NEW.raw_user_meta_data->>'nombre' IS NOT NULL THEN
    v_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'gratis');

    INSERT INTO admins (id, nombre, email, telefono, plan, plan_status, trial_ends_at)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre',
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
      v_plan,
      CASE WHEN v_plan = 'gratis' THEN 'active' ELSE 'trial' END,
      CASE WHEN v_plan = 'gratis' THEN NULL ELSE NOW() + INTERVAL '14 days' END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
