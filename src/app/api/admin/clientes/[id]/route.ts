import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const { accion, plan } = body

  const admin = createAdminClient()

  if (accion === 'activar') {
    const paidUntil = new Date()
    paidUntil.setMonth(paidUntil.getMonth() + 1)

    const { error } = await admin
      .from('admins')
      .update({ plan_status: 'active', plan_paid_until: paidUntil.toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'suspender') {
    const { error } = await admin
      .from('admins')
      .update({ plan_status: 'suspended' })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'cambiar_plan' && plan) {
    const planesValidos = ['gratis', 'mini', 'basico', 'starter', 'pro', 'business']
    if (!planesValidos.includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const { error } = await admin
      .from('admins')
      .update({ plan })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'extender_trial') {
    const nuevaFecha = new Date()
    nuevaFecha.setDate(nuevaFecha.getDate() + 14)

    const { error } = await admin
      .from('admins')
      .update({ plan_status: 'trial', trial_ends_at: nuevaFecha.toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
