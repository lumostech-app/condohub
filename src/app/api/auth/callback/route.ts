import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLANES_VALIDOS = ['gratis', 'mini', 'basico', 'starter', 'pro', 'business'] as const

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Asegurar que el admin record existe y tiene el plan correcto.
  // Esto cubre el caso donde el trigger de BD falló durante el signup.
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email && user.user_metadata?.nombre) {
      const db = createAdminClient()

      const { data: existing } = await db
        .from('admins')
        .select('id, plan')
        .eq('id', user.id)
        .single()

      const rawPlan = user.user_metadata?.plan_intend ?? user.user_metadata?.plan ?? 'gratis'
      const plan = PLANES_VALIDOS.includes(rawPlan as typeof PLANES_VALIDOS[number])
        ? rawPlan as typeof PLANES_VALIDOS[number]
        : 'gratis'
      const planStatus = plan === 'gratis' ? 'active' : 'trial'
      const trialEndsAt = plan === 'gratis'
        ? null
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      if (!existing) {
        // Trigger falló — crear admin record ahora
        await db.from('admins').insert({
          id: user.id,
          nombre: user.user_metadata.nombre,
          email: user.email,
          telefono: user.user_metadata?.telefono ?? `pending_${user.id}`,
          plan,
          plan_status: planStatus,
          trial_ends_at: trialEndsAt,
        })
      } else if (existing.plan !== plan && user.user_metadata?.plan_intend === 'gratis') {
        // Admin existe pero con plan incorrecto (trigger usó 'mini') → corregir
        await db.from('admins').update({
          plan,
          plan_status: planStatus,
          trial_ends_at: trialEndsAt,
        }).eq('id', user.id)
      }
    }
  } catch (e) {
    // No bloquear la redirección al dashboard por errores de BD
    console.error('[callback] error al sincronizar admin:', e)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
