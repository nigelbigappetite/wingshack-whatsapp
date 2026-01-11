'use client'

interface ExportButtonProps {
  startDate?: string
  endDate?: string
}

export function ExportButton({ startDate, endDate }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const response = await fetch(`/api/export/threads?${params.toString()}`)
      if (!response.ok) {
        alert('Failed to export threads')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'threads.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export threads')
    }
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '10px 20px',
        background: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      Export CSV
    </button>
  )
}

