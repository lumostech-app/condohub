# CondoHub — Instrucciones para Claude

## Rama de trabajo
**Siempre usar `main`.** Nunca hacer push a otras ramas.

## Git
Después de cada cambio: `git add`, `git commit`, `git push origin main`. Sin preguntar.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Twilio WhatsApp bot
- Vercel (deploy desde `main`)

## Estructura
- `src/app/(auth)/` — panel autenticado (sidebar + layout)
- `src/app/(public)/` — landing, login, registro
- `src/app/api/` — endpoints REST
- `src/components/shell/` — Sidebar, MobileHeader, ShellWrapper, MobileNavWrapper
- `src/components/ui/` — PageHeader, StatCard
- `src/lib/supabase/` — client.ts (browser), server.ts (SSR), admin.ts (service role)

## Convenciones
- No `max-w-2xl` en páginas autenticadas — usar `max-w-5xl` o `max-w-7xl`
- Páginas server component cuando sea posible; client component solo si hay interactividad
- Sin comentarios innecesarios en el código
