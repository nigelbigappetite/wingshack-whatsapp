import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'

// Track last webhook received timestamp (in-memory for now)
let lastWebhookReceivedAt: string | null = null

// Export function to update last webhook time (called from webhook handler)
export function updateLastWebhookTime() {
  lastWebhookReceivedAt = new Date().toISOString()
}

export async function GET() {
  try {
    // Test Supabase connection
    let supabaseOk = false
    try {
      const { error } = await supabaseAdmin.from('threads').select('id').limit(1)
      supabaseOk = !error
    } catch (error) {
      supabaseOk = false
    }

    // Test Realtime connection
    let realtimeOk = false
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
        // Try to create a test channel
        const channel = supabaseClient.channel('health-check')
        await channel.subscribe((status) => {
          realtimeOk = status === 'SUBSCRIBED'
          channel.unsubscribe()
        })
        // Give it a moment to connect
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      realtimeOk = false
    }

    return NextResponse.json({
      supabase_ok: supabaseOk,
      realtime_ok: realtimeOk,
      last_webhook_received_at: lastWebhookReceivedAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        supabase_ok: false,
        realtime_ok: false,
        last_webhook_received_at: lastWebhookReceivedAt,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

