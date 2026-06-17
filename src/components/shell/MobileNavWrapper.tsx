'use client'

import { usePathname } from 'next/navigation'
import MobileHeader from './MobileHeader'

interface Condominio {
  id: string
  nombre: string
}

interface MobileNavWrapperProps {
  adminNombre: string
  plan: string
  condominios: Condominio[]
}

export default function MobileNavWrapper({ adminNombre, plan, condominios }: MobileNavWrapperProps) {
  const pathname = usePathname()
  const match = pathname.match(/^\/condominios\/([^/]+)/)
  const condoId = match?.[1]
  const condo = condoId ? condominios.find(c => c.id === condoId) : undefined

  return (
    <MobileHeader
      adminNombre={adminNombre}
      plan={plan}
      condoId={condoId}
      condoNombre={condo?.nombre}
    />
  )
}
