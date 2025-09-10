import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

console.log('🔧 Supabase Config:', { 
  url: supabaseUrl, 
  hasAnonKey: !!supabaseAnonKey,
  anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
})

// Client-side Supabase client (uses anonymous key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role key)
// ⚠️  This should ONLY be used in API routes or server-side code
export const supabaseAdmin = (() => {
  // Only create admin client on server-side
  if (typeof window === 'undefined') {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
    }
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  // Return null on client-side to prevent accidental usage
  return null
})()