import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://douzrnpcfrxavsefekyr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdXpybnBjZnJ4YXZzZWZla3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjI0MzYsImV4cCI6MjA3MjU5ODQzNn0.BvIMbxLMdBnYiNA9Fx8qLRUJLiYp5LHtfXM8xaVbdXs'

console.log('🔧 Supabase Config:', { 
  url: supabaseUrl, 
  hasAnonKey: !!supabaseAnonKey,
  anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdXpybnBjZnJ4YXZzZWZla3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAyMjQzNiwiZXhwIjoyMDcyNTk4NDM2fQ.eWySvr3m9-qRLiJC8AT9i2n4jxZEJ2Os7PftyEFbGzo',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)