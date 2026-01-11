'use client'

import { useEffect, useState } from 'react'

interface WorkerHealth {
  whatsapp_connected: boolean
  last_inbound_at: string | null
  last_outbound_sent_at: string | null
  queue_depth: {
    queued: number
    processing: number
    failed: number
  }
  session_path: string
}

interface DashboardHealth {
  supabase_ok: boolean
  realtime_ok: boolean
  last_webhook_received_at: string | null
}

export function SystemStatus() {
  const [workerHealth, setWorkerHealth] = useState<WorkerHealth | null>(null)
  const [dashboardHealth, setDashboardHealth] = useState<DashboardHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [workerUrl, setWorkerUrl] = useState<string>('')

  useEffect(() => {
    // Get worker URL from environment or use default
    const url = process.env.NEXT_PUBLIC_WORKER_URL || ''
    setWorkerUrl(url)
    
    const fetchHealth = async () => {
      try {
        // Fetch dashboard health
        const dashboardResponse = await fetch('/api/health')
        const dashboardData: DashboardHealth = await dashboardResponse.json()
        setDashboardHealth(dashboardData)

        // Fetch worker health if URL is available
        if (url) {
          try {
            const workerResponse = await fetch(`${url}/health`)
            const workerData: WorkerHealth = await workerResponse.json()
            setWorkerHealth(workerData)
          } catch (error) {
            console.error('Error fetching worker health:', error)
            setWorkerHealth(null)
          }
        }
      } catch (error) {
        console.error('Error fetching health:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="system-status">
        <div className="status-loading">Loading system status...</div>
      </div>
    )
  }

  return (
    <div className="system-status">
      <h3>System Status</h3>
      
      <div className="status-grid">
        <div className="status-item">
          <div className="status-label">Worker</div>
          <div className={`status-value ${workerHealth?.whatsapp_connected ? 'status-online' : 'status-offline'}`}>
            {workerHealth ? (workerHealth.whatsapp_connected ? 'Online' : 'Offline') : 'Unknown'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-label">Last Inbound</div>
          <div className="status-value">
            {workerHealth?.last_inbound_at ? formatTime(workerHealth.last_inbound_at) : 'Never'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-label">Queue Depth</div>
          <div className="status-value">
            {workerHealth ? (
              <>
                Queued: {workerHealth.queue_depth.queued} | 
                Processing: {workerHealth.queue_depth.processing} | 
                Failed: {workerHealth.queue_depth.failed}
              </>
            ) : (
              'N/A'
            )}
          </div>
        </div>

        <div className="status-item">
          <div className="status-label">Supabase</div>
          <div className={`status-value ${dashboardHealth?.supabase_ok ? 'status-online' : 'status-offline'}`}>
            {dashboardHealth?.supabase_ok ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-label">Realtime</div>
          <div className={`status-value ${dashboardHealth?.realtime_ok ? 'status-online' : 'status-offline'}`}>
            {dashboardHealth?.realtime_ok ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="status-item">
          <div className="status-label">Last Webhook</div>
          <div className="status-value">
            {dashboardHealth?.last_webhook_received_at ? formatTime(dashboardHealth.last_webhook_received_at) : 'Never'}
          </div>
        </div>
      </div>
    </div>
  )
}

