-- Migración 005: Plan gratuito permanente
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. AMPLIAR CHECK CONSTRAINT: agregar 'gratis'
-- ============================================================
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_plan_check;
ALTER TABLE admins ADD CONSTRAINT admins_plan_check
  CHECK (plan IN ('gratis','mini','basico','starter','pro','business'));

-- ============================================================
-- 2. TRIGGER ROBUSTO: nunca cancela el signup por un error
--    de BD. Usa un bloque BEGIN/EXCEPTION interno para que
--    cualquier fallo en admins no bloquee la creación del
--    usuario en auth.users.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan      text;
  v_status    text;
  v_trial_end timestamptz;
BEGIN
  -- Solo actuar para registros del formulario de administradores
  -- (tienen 'nombre' en metadata). Google OAuth de residentes no.
  IF NEW.raw_user_meta_data->>'nombre' IS NOT NULL THEN

    -- Respetar plan_intend (cuando el frontend forzó plan='mini' en el trigger)
    v_plan := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'plan_intend', ''),
      NULLIF(NEW.raw_user_meta_data->>'plan', ''),
      'gratis'
    );

    -- Normalizar: si el valor no es conocido, usar gratis
    IF v_plan NOT IN ('gratis','mini','basico','starter','pro','business') THEN
      v_plan := 'gratis';
    END IF;

    v_status    := CASE WHEN v_plan = 'gratis' THEN 'active' ELSE 'trial' END;
    v_trial_end := CASE WHEN v_plan = 'gratis' THEN NULL ELSE NOW() + INTERVAL '14 days' END;

    BEGIN
      INSERT INTO admins (id, nombre, email, telefono, plan, plan_status, trial_ends_at)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'nombre',
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'telefono', ''), 'pending_' || NEW.id::text),
        v_plan,
        v_status,
        v_trial_end
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- El admin record se creará desde el callback de verificación.
      -- Nunca cancelar la creación del usuario en auth.
      RAISE WARNING 'handle_new_user: no se pudo crear admin para % — %', NEW.id, SQLERRM;
    END;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
