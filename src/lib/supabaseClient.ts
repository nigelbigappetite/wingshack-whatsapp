import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client for real-time subscriptions
// Uses anon key (read-only) for client-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL - check Vercel environment variables')
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please add it in Vercel Settings → Environment Variables and redeploy.')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY - check Vercel environment variables')
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please add it in Vercel Settings → Environment Variables and redeploy.')
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)


