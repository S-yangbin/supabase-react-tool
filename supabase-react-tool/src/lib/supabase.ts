import { createClient } from '@supabase/supabase-js'
import { validateEnvironment } from './env-validator'

// 验证并获取环境变量
const env = validateEnvironment()

export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)

console.log('Supabase client created:', supabase)