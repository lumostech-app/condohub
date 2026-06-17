'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  adminNombre: string
  plan: string
}

const iconDashboard = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const iconBuilding = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const iconDollar = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const iconReceipt = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const iconExpense = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const iconHome = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
  </svg>
)

const iconUsers = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const iconKey = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const iconWorker = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const iconStar = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const iconChart = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const iconCog = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const iconUser = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const iconArrowLeft = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

function NavLink({ href, icon, label, onClick }: NavItem & { onClick?: () => void }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && href !== '/condominios' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
      {label}
    </Link>
  )
}

const PLAN_LABELS: Record<string, string> = {
  gratis: 'Gratis',
  basico: 'Básico',
  plus:   'Básico+',
}

const PLAN_COLORS: Record<string, string> = {
  gratis: 'bg-gray-100 text-gray-600',
  basico: 'bg-blue-100 text-blue-700',
  plus:   'bg-indigo-100 text-indigo-700',
}

export function SidebarContent({ adminNombre, plan, condoId, condoNombre, onNav }: {
  adminNombre: string
  plan: string
  condoId?: string
  condoNombre?: string
  onNav?: () => void
}) {
  const globalSections: NavSection[] = [
    {
      items: [
        { href: '/dashboard', icon: iconDashboard, label: 'Panel de control' },
        { href: '/condominios', icon: iconBuilding, label: 'Mis Condominios' },
      ],
    },
  ]

  const condoSections: NavSection[] = condoId ? [
    {
      items: [
        { href: '/condominios', icon: iconArrowLeft, label: 'Mis Condominios' },
      ],
    },
    {
      title: 'OPERACIÓN',
      items: [
        { href: `/condominios/${condoId}/cuotas`, icon: iconDollar, label: 'Cuotas' },
        { href: `/condominios/${condoId}/pagos`, icon: iconReceipt, label: 'Pagos recibidos' },
        { href: `/condominios/${condoId}/gastos`, icon: iconExpense, label: 'Gastos' },
      ],
    },
    {
      title: 'DIRECTORIO',
      items: [
        { href: `/condominios/${condoId}/unidades`, icon: iconHome, label: 'Unidades' },
        { href: `/condominios/${condoId}/propietarios`, icon: iconUsers, label: 'Propietarios' },
        { href: `/condominios/${condoId}/inquilinos`, icon: iconKey, label: 'Inquilinos' },
        { href: `/condominios/${condoId}/empleados`, icon: iconWorker, label: 'Empleados' },
      ],
    },
    {
      title: 'INSTALACIONES',
      items: [
        { href: `/condominios/${condoId}/areas`, icon: iconStar, label: 'Áreas comunes' },
      ],
    },
    {
      title: 'REPORTES',
      items: [
        { href: `/condominios/${condoId}/reportes`, icon: iconChart, label: 'Reporte mensual' },
      ],
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { href: `/condominios/${condoId}/configuracion`, icon: iconCog, label: 'Config. cuotas' },
      ],
    },
  ] : []

  const sections = condoId ? condoSections : globalSections

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/dashboard" onClick={onNav} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CH</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">CondoHub</span>
        </Link>
      </div>

      {/* Condominio context header */}
      {condoId && condoNombre && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Condominio</p>
          <Link
            href={`/condominios/${condoId}`}
            onClick={onNav}
            className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2"
          >
            {condoNombre}
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map((section, i) => (
          <div key={i} className={i > 0 ? 'pt-2' : ''}>
            {section.title && (
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {section.title}
              </p>
            )}
            {section.items.map(item => (
              <NavLink key={item.href} {...item} onClick={onNav} />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: account + plan */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        <NavLink href="/configuracion" icon={iconUser} label="Mi cuenta" onClick={onNav} />
        <Link href="/suscripcion" onClick={onNav} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-xs text-gray-500">{adminNombre.split(' ')[0]}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan] ?? 'bg-gray-100 text-gray-600'}`}>
            {PLAN_LABELS[plan] ?? plan}
          </span>
        </Link>
      </div>
    </div>
  )
}

export default function Sidebar({ adminNombre, plan, condoId, condoNombre }: SidebarProps & { condoId?: string; condoNombre?: string }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0">
      <SidebarContent adminNombre={adminNombre} plan={plan} condoId={condoId} condoNombre={condoNombre} />
    </aside>
  )
}
