'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Channel {
  id: string
  name: string
  whatsapp_number: string
}

export function ChannelSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      // For now, we'll fetch from a future API endpoint
      // For MVP, just show default channel
      setChannels([{ id: 'default', name: 'Default', whatsapp_number: 'default' }])
      setSelectedChannelId('default')
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  // Only show selector if multiple channels exist
  if (channels.length <= 1) {
    return null
  }

  return (
    <div className="channel-selector" style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e0e0e0' }}>
      <label>
        Channel:
        <select
          value={selectedChannelId}
          onChange={(e) => {
            setSelectedChannelId(e.target.value)
            // Update URL or filter threads by channel
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.value) {
              params.set('channel', e.target.value)
            } else {
              params.delete('channel')
            }
            router.push(`/inbox?${params.toString()}`)
          }}
          style={{ marginLeft: '8px', padding: '6px' }}
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

