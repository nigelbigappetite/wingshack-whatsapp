type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  request_id?: string
  thread_id?: string
  contact_id?: string
  message_id?: string
  job_id?: string
  direction?: 'in' | 'out'
  provider_message_id?: string
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  timestamp: string
  event: string
  data?: any
  request_id?: string
  thread_id?: string
  contact_id?: string
  message_id?: string
  job_id?: string
  direction?: 'in' | 'out'
  provider_message_id?: string
}

function createLogEntry(
  level: LogLevel,
  event: string,
  context: LogContext = {},
  data?: any
): LogEntry {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    event,
    ...context,
  }

  if (data !== undefined) {
    entry.data = data
  }

  return entry
}

export const logger = {
  debug: (event: string, context?: LogContext, data?: any) => {
    const entry = createLogEntry('debug', event, context, data)
    console.log(JSON.stringify(entry))
  },

  info: (event: string, context?: LogContext, data?: any) => {
    const entry = createLogEntry('info', event, context, data)
    console.log(JSON.stringify(entry))
  },

  warn: (event: string, context?: LogContext, data?: any) => {
    const entry = createLogEntry('warn', event, context, data)
    console.warn(JSON.stringify(entry))
  },

  error: (event: string, context?: LogContext, data?: any) => {
    const entry = createLogEntry('error', event, context, data)
    console.error(JSON.stringify(entry))
  },
}

