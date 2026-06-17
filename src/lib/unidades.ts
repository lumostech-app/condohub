export type SegLabel = 'letra' | 'numero' | 'ninguno'
export type SegUnidad = 'numero' | 'numeroCero' | 'letra'

export interface FormatoUnidad {
  familia: 'porEdificio' | 'porPiso'
  edificio: SegLabel
  piso: 'numero' | 'ninguno'
  unidad: SegUnidad
}

export interface EdificioConfig {
  label: string
  pisos: number
  unidadesPorPiso: number
  unidadesTotal: number
}

export interface UnidadGen {
  codigo: string
  piso: number | null
  tipo: 'apartamento' | 'sotano'
}

export interface Preset {
  label: string
  ejemplo: string
  formato: FormatoUnidad
}

export const PRESETS: Record<string, Preset> = {
  letraNumero: {
    label: 'Letra + número',
    ejemplo: 'A1, A2, B1, B2',
    formato: { familia: 'porEdificio', edificio: 'letra', piso: 'ninguno', unidad: 'numero' },
  },
  pisoUnidad: {
    label: 'Piso + unidad',
    ejemplo: '101, 102, 201, 202',
    formato: { familia: 'porPiso', edificio: 'ninguno', piso: 'numero', unidad: 'numeroCero' },
  },
  pisoLetra: {
    label: 'Piso + letra',
    ejemplo: '1A, 1B, 2A, 2B',
    formato: { familia: 'porPiso', edificio: 'ninguno', piso: 'numero', unidad: 'letra' },
  },
  correlativo: {
    label: 'Correlativo',
    ejemplo: '1, 2, 3, 4',
    formato: { familia: 'porEdificio', edificio: 'ninguno', piso: 'ninguno', unidad: 'numero' },
  },
}

function letraDesde(n: number): string {
  let result = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
}

export function generarUnidades(
  edificios: EdificioConfig[],
  f: FormatoUnidad,
): { label: string; unidades: UnidadGen[] }[] {
  return edificios.map(ed => {
    const unidades: UnidadGen[] = []

    if (f.familia === 'porEdificio') {
      const total = ed.unidadesTotal
      const digits = Math.max(2, String(total).length)
      for (let i = 1; i <= total; i++) {
        let codigo = ''
        if (f.edificio !== 'ninguno') codigo += ed.label
        if (f.unidad === 'numero') codigo += String(i)
        else if (f.unidad === 'numeroCero') codigo += String(i).padStart(digits, '0')
        else if (f.unidad === 'letra') codigo += letraDesde(i)
        unidades.push({ codigo: codigo.toUpperCase(), piso: null, tipo: 'apartamento' })
      }
    } else {
      const { pisos, unidadesPorPiso } = ed
      const digits = Math.max(2, String(unidadesPorPiso).length)
      for (let p = 1; p <= pisos; p++) {
        for (let u = 1; u <= unidadesPorPiso; u++) {
          let codigo = ''
          if (f.edificio !== 'ninguno') codigo += ed.label
          if (f.piso === 'numero') codigo += String(p)
          if (f.unidad === 'numero') codigo += String(u)
          else if (f.unidad === 'numeroCero') codigo += String(u).padStart(digits, '0')
          else if (f.unidad === 'letra') codigo += letraDesde(u)
          unidades.push({ codigo: codigo.toUpperCase(), piso: p, tipo: 'apartamento' })
        }
      }
    }

    return { label: ed.label, unidades }
  })
}

export function letraEdificio(n: number): string {
  return String.fromCharCode(64 + n)
}
