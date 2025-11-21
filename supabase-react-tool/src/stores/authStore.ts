import { makeAutoObservable } from 'mobx'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface AuthMessage {
  type: 'success' | 'error'
  content: string
}

export class AuthStore {
  user: SupabaseUser | null = null
  loading: boolean = false
  message: AuthMessage | null = null

  constructor() {
    makeAutoObservable(this)
    this.initializeAuthListener()
  }

  private initializeAuthListener = () => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        this.setUser(session?.user || null)
        if (session) {
          this.setMessage({ type: 'success', content: '登录成功！' })
        }
      }
    )

    // 检查当前会话
    this.checkCurrentSession()

    return () => {
      subscription.unsubscribe()
    }
  }

  private checkCurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        this.setUser(session.user)
      }
    } catch (error) {
      console.error('检查会话失败:', error)
    }
  }

  setUser = (user: SupabaseUser | null) => {
    this.user = user
  }

  setMessage = (message: AuthMessage | null) => {
    this.message = message
  }

  setLoading = (loading: boolean) => {
    this.loading = loading
  }

  handleLogin = async (email: string, password: string) => {
    try {
      this.setLoading(true)
      this.setMessage(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        this.setMessage({ type: 'error', content: error.message })
        return false
      }
      return true
    } catch (error: any) {
      this.setMessage({ type: 'error', content: error.message })
      return false
    } finally {
      this.setLoading(false)
    }
  }

  handleSignup = async (email: string, password: string) => {
    try {
      this.setLoading(true)
      this.setMessage(null)

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        this.setMessage({ type: 'error', content: error.message })
        return false
      } else {
        this.setMessage({ type: 'success', content: 'Check your email for the confirmation link!' })
        return true
      }
    } catch (error: any) {
      this.setMessage({ type: 'error', content: error.message })
      return false
    } finally {
      this.setLoading(false)
    }
  }

  handleLogout = async () => {
    try {
      this.setLoading(true)
      this.setMessage(null)

      const { error } = await supabase.auth.signOut()
      if (error) {
        this.setMessage({ type: 'error', content: error.message })
        return false
      } else {
        this.setMessage({ type: 'success', content: 'Logged out successfully!' })
        return true
      }
    } catch (error: any) {
      this.setMessage({ type: 'error', content: error.message })
      return false
    } finally {
      this.setLoading(false)
    }
  }
}
