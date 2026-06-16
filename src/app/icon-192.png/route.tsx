import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '192px',
          height: '192px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: '40px',
        }}
      >
        <span style={{ color: 'white', fontSize: 90, fontWeight: 900, letterSpacing: '-4px' }}>
          CH
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  )
}
