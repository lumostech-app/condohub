'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'

interface Condominio {
  id: string
  nombre: string
}

interface ShellWrapperProps {
  adminNombre: string
  plan: string
  condominios: Condominio[]
}

export default function ShellWrapper({ adminNombre, plan, condominios }: ShellWrapperProps) {
  const pathname = usePathname()

  // Extract condoId from /condominios/[id]/...
  const match = pathname.match(/^\/condominios\/([^\/]+)/)
  const condoId = match?.[1]
  const condo = condoId ? condominios.find(c => c.id === condoId) : undefined

  return (
    <>
      <Sidebar
        adminNombre={adminNombre}
        plan={plan}
        condoId={condoId}
        condoNombre={condo?.nombre}
      />
      <MobileHeader
        adminNombre={adminNombre}
        plan={plan}
        condoId={condoId}
        condoNombre={condo?.nombre}
      />
    </>
  )
}
