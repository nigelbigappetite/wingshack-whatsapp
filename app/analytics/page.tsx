'use client'

import { useState, useEffect } from 'react'
import { MetricsCard } from './components/MetricsCard'
import { DateRangePicker } from './components/DateRangePicker'

interface Summary {
  total_threads: number
  threads_with_response: number
  avg_first_response_seconds: number
  total_inbound_messages: number
  total_outbound_messages: number
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const response = await fetch(`/api/analytics/metrics?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [startDate, endDate])

  const formatSeconds = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading analytics...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Analytics & Reporting</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <ExportButton startDate={startDate} endDate={endDate} />
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <MetricsCard
            title="Total Threads"
            value={summary.total_threads.toString()}
          />
          <MetricsCard
            title="Threads with Response"
            value={summary.threads_with_response.toString()}
          />
          <MetricsCard
            title="Avg First Response"
            value={formatSeconds(summary.avg_first_response_seconds)}
          />
          <MetricsCard
            title="Total Inbound"
            value={summary.total_inbound_messages.toString()}
          />
          <MetricsCard
            title="Total Outbound"
            value={summary.total_outbound_messages.toString()}
          />
        </div>
      )}
    </div>
  )
}

