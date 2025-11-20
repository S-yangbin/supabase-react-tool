interface EnvironmentVariables {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

export function validateEnvironment(): EnvironmentVariables {
  const env = import.meta.env
  
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