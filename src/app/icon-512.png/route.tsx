import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: '100px',
        }}
      >
        <span style={{ color: 'white', fontSize: 240, fontWeight: 900, letterSpacing: '-10px' }}>
          CH
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
