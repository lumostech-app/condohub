# Guía de Deploy — CondoHub

## 1. Supabase

1. Crear proyecto en supabase.com
2. Ir a SQL Editor y ejecutar:
   - `supabase/migrations/001_schema_inicial.sql`
   - `supabase/migrations/002_fixes_y_storage.sql`
3. Copiar las 3 keys del proyecto:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`
4. En Authentication > URL Configuration:
   - Site URL: `https://condohub.com`
   - Redirect URLs: `https://condohub.com/api/auth/callback`
5. En Authentication > Email Templates:
   - Cambiar idioma a español (opcional)

## 2. Twilio WhatsApp

1. Crear cuenta en twilio.com
2. Solicitar número WhatsApp Business (proceso toma ~1 semana)
3. En WhatsApp Senders, configurar webhook:
   - URL: `https://condohub.com/api/webhooks/twilio`
   - Method: POST
4. Copiar:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
   - Número → `TWILIO_WHATSAPP_NUMBER` (formato: `whatsapp:+1XXXXXXXXXX`)
5. Para enviar mensajes proactivos (recordatorios), crear plantillas en Meta Business Manager
   y marcar `aprobada_meta = true` en la tabla `whatsapp_plantillas`

## 3. PayPal

1. Crear cuenta en [developer.paypal.com](https://developer.paypal.com)
2. Ir a **My Apps & Credentials** → crear app REST:
   - Nombre: `CondoHub`
   - Tipo: `Merchant`
3. Copiar las credenciales:
   - Client ID → `NEXT_PUBLIC_PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_ID`
   - Client Secret → `PAYPAL_CLIENT_SECRET`
4. Cambiar `PAYPAL_API_URL`:
   - Sandbox (pruebas): `https://api-m.sandbox.paypal.com`
   - Producción (real): `https://api-m.paypal.com`
5. Configurar webhook en PayPal Dashboard:
   - URL: `https://condohub.com/api/paypal/webhook`
   - Eventos a escuchar: `CHECKOUT.ORDER.COMPLETED`, `PAYMENT.CAPTURE.COMPLETED`
   - Copiar el Webhook ID → `PAYPAL_WEBHOOK_ID`
6. Ejecutar `supabase/migrations/003_paypal.sql` en Supabase SQL Editor

### Precios en USD (cobro a admins por la suscripción):
| Plan     | RD$/mes | USD/mes |
|----------|---------|---------|
| Mini     | 990     | $17     |
| Básico   | 1,490   | $25     |
| Starter  | 2,500   | $43     |
| Pro      | 4,500   | $77     |
| Business | 7,500   | $129    |

## 4. Anthropic

1. Crear API key en console.anthropic.com
2. Copiar → `ANTHROPIC_API_KEY`

## 4. Vercel

1. Conectar repositorio en vercel.com
2. Configurar variables de entorno (Settings > Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
NEXT_PUBLIC_APP_URL=https://condohub.com
CRON_SECRET=<generar con: openssl rand -hex 32>
SUPER_ADMIN_EMAIL=tu@email.com
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_API_URL=https://api-m.paypal.com
```

3. Hacer deploy → Vercel detecta `vercel.json` y configura los 3 crons automáticamente
4. Configurar dominio personalizado: condohub.com

## 5. Verificar después del deploy

- [ ] Visitar condohub.com → Landing carga
- [ ] Registro de cuenta → Email de confirmación llega
- [ ] Confirmar email → Redirige a /dashboard
- [ ] Crear condominio → Onboarding IA funciona
- [ ] Enviar "morosos" al número WhatsApp → Bot responde
- [ ] Enviar foto de comprobante → Claude Vision extrae datos
- [ ] Verificar crons en Vercel Dashboard > Cron Jobs
