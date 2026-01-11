import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET(request: NextRequest) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get thread metrics
    const { data: threadMetrics, error: metricsError } = await supabaseAdmin
      .from('thread_metrics')
      .select('*')
      .limit(1000)

    if (metricsError) {
      logger.error('analytics_metrics_error', logContext, metricsError)
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      )
    }

    // Get daily message stats
    let dailyStatsQuery = supabaseAdmin
      .from('daily_message_stats')
      .select('*')

    if (startDate) {
      dailyStatsQuery = dailyStatsQuery.gte('date', startDate)
    }
    if (endDate) {
      dailyStatsQuery = dailyStatsQuery.lte('date', endDate)
    }

    const { data: dailyStats, error: dailyError } = await dailyStatsQuery
      .order('date', { ascending: false })

    if (dailyError) {
      logger.error('analytics_daily_error', logContext, dailyError)
      return NextResponse.json(
        { error: 'Failed to fetch daily stats' },
        { status: 500 }
      )
    }

    // Calculate summary metrics
    const totalThreads = threadMetrics?.length || 0
    const threadsWithResponse = threadMetrics?.filter((t: any) => t.first_response_seconds !== null).length || 0
    const avgFirstResponseTime = threadMetrics?.length
      ? threadMetrics
          .filter((t: any) => t.first_response_seconds !== null)
          .reduce((sum: number, t: any) => sum + (t.first_response_seconds || 0), 0) / threadsWithResponse
      : 0

    const totalInbound = threadMetrics?.reduce((sum: number, t: any) => sum + (t.inbound_count || 0), 0) || 0
    const totalOutbound = threadMetrics?.reduce((sum: number, t: any) => sum + (t.outbound_count || 0), 0) || 0

    logger.info('analytics_fetched', logContext, { total_threads: totalThreads })

    return NextResponse.json({
      summary: {
        total_threads: totalThreads,
        threads_with_response: threadsWithResponse,
        avg_first_response_seconds: avgFirstResponseTime,
        total_inbound_messages: totalInbound,
        total_outbound_messages: totalOutbound,
      },
      thread_metrics: threadMetrics || [],
      daily_stats: dailyStats || [],
    })
  } catch (error: any) {
    logger.error('analytics_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

