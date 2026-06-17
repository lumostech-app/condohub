interface StatCardProps {
  label: string
  value: string
  subvalue?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
}

const colorMap = {
  blue:   { card: 'bg-blue-50 border-blue-100',   value: 'text-blue-700' },
  green:  { card: 'bg-green-50 border-green-100', value: 'text-green-700' },
  red:    { card: 'bg-red-50 border-red-100',     value: 'text-red-600' },
  yellow: { card: 'bg-amber-50 border-amber-100', value: 'text-amber-700' },
  gray:   { card: 'bg-white border-gray-100',     value: 'text-gray-900' },
}

export default function StatCard({ label, value, subvalue, color = 'gray' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`rounded-2xl border p-4 ${c.card}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${c.value}`}>{value}</p>
      {subvalue && <p className="text-xs text-gray-400 mt-0.5">{subvalue}</p>}
    </div>
  )
}
