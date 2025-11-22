interface EnvironmentVariables {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

export function validateEnvironment(): EnvironmentVariables {
  const env = import.meta.env
  env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || "https://atjkovqbfncwtomeqekd.supabase.co"
  env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0amtvdnFiZm5jd3RvbWVxZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzgwNjQsImV4cCI6MjA3ODk1NDA2NH0.Y_d8EjQHO5dasiEwITOyK1xexvtDWFioJEON_JhB_nI"
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const
  
  const missingVars = requiredVars.filter(
    (key) => !env[key] || typeof env[key] !== 'string'
  )
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }
  
  return {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
  }
}