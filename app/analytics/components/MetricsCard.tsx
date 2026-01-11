'use client'

interface MetricsCardProps {
  title: string
  value: string
}

export function MetricsCard({ title, value }: MetricsCardProps) {
  return (
    <div
      style={{
        padding: '20px',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>
        {value}
      </div>
    </div>
  )
}

