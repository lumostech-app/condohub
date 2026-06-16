import twilio from 'twilio'
import { NextResponse } from 'next/server'

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

export async function sendWhatsAppMessage(to: string, body: string) {
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  await getTwilioClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER!,
    to: toFormatted,
    body,
  })
}

export function twimlResponse(message: string): NextResponse {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } }
  )
}

export function twimlEmpty(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response/>',
    { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } }
  )
}

export function getMesNombreBot(mes: number, anio: number): string {
  return new Date(anio, mes - 1).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
}
