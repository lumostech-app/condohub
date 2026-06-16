import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Si el usuario se registró con intención de plan gratis,
      // actualizamos su registro (requiere que migración 005 esté aplicada).
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.plan_intend === 'gratis') {
          const db = createAdminClient()
          await db.from('admins')
            .update({ plan: 'gratis', plan_status: 'active', trial_ends_at: null })
            .eq('id', user.id)
        }
      } catch {
        // Si la migración 005 no está aplicada, el update falla silenciosamente.
        // El usuario queda como 'mini'/'trial' hasta que se ejecute la migración.
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
