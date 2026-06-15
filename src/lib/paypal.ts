const PAYPAL_API = process.env.PAYPAL_API_URL ?? 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  const data = await res.json()
  return data.access_token as string
}

export async function createPayPalOrder(amount: string, plan: string, adminId: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'PayPal-Request-Id': `${adminId}-${plan}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `${adminId}|${plan}`,
        description: `CondoHub Plan ${plan} — 1 mes`,
        amount: { currency_code: 'USD', value: amount },
      }],
      application_context: {
        brand_name: 'CondoHub',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/suscripcion/exito`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/suscripcion`,
      },
    }),
  })
  return res.json()
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  return res.json()
}

export async function getPayPalOrder(orderId: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  rawBody: string,
  webhookId: string
): Promise<boolean> {
  try {
    const token = await getAccessToken()
    const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_id: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    })
    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}
