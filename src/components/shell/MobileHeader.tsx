'use client'

import { useState } from 'react'
import { SidebarContent } from './Sidebar'

interface MobileHeaderProps {
  adminNombre: string
  plan: string
  condoId?: string
  condoNombre?: string
  pageTitle?: string
}

export default function MobileHeader({ adminNombre, plan, condoId, condoNombre, pageTitle }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">CH</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            {pageTitle ?? (condoNombre ?? 'CondoHub')}
          </span>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent
          adminNombre={adminNombre}
          plan={plan}
          condoId={condoId}
          condoNombre={condoNombre}
          onNav={() => setOpen(false)}
        />
      </div>
    </>
  )
}
