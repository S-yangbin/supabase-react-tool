# Day 2: Supabase 基础配置和认证系统

## 学习目标
- 创建 Supabase 项目并配置数据库
- 实现用户认证系统
- 创建示例数据表

## 具体步骤

### 1. 创建 Supabase 项目 (30分钟)
- 访问 [Supabase Dashboard](https://supabase.com/dashboard)
- 创建新项目
- 记录项目 URL 和 anon key
- 配置环境变量到本地项目

### 2. 配置认证系统 (45分钟)
创建 `src/components/SupabaseAuth.tsx`：
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const SupabaseAuth: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 检查当前会话
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }

    checkSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Logged out successfully!')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {user ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Logged in as:</h3>
          <p className="text-gray-600">{user.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          {message && (
            <div
              className={`p-3 rounded ${
                message.includes('success') || message.includes('successfully') ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {message}
            </div>
          )}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SupabaseAuth
```

### 3. 创建数据库表 (30分钟)
在 Supabase 仪表板中执行以下 SQL：
```sql
-- 创建 todos 表
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
```

### 4. 配置 RLS 策略 (20分钟)
```sql
-- 创建 RLS 策略
CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 5. 测试认证功能 (20分钟)
- 启动本地开发服务器
- 在浏览器中测试登录/注册功能
- 验证用户会话管理
- 确认认证状态正确显示

### 6. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加认证系统: Supabase Auth 组件和数据库配置"
```

## 学习资源
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React 认证模式](https://supabase.com/docs/guides/auth/auth-helpers/react)

## 今日目标检查
- [ ] Supabase 项目创建成功
- [ ] 认证组件正常工作
- [ ] 数据库表和 RLS 策略配置完成
- [ ] 用户注册/登录/登出功能正常
- [ ] 环境变量正确配置
