import React, { useEffect } from 'react'
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const { Title, Text } = Typography

interface AuthFormValues {
  email: string
  password: string
}

const SupabaseAuth: React.FC = () => {
  const [user, setUser] = React.useState<SupabaseUser | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; content: string } | null>(null)
  const [form] = Form.useForm()

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
          setMessage({ type: 'success', content: '登录成功！' })
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (values: AuthFormValues) => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setMessage({ type: 'error', content: error.message })
    }
    setLoading(false)
  }

  const handleSignup = async (values: AuthFormValues) => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setMessage({ type: 'error', content: error.message })
    } else {
      setMessage({ type: 'success', content: 'Check your email for the confirmation link!' })
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMessage({ type: 'error', content: error.message })
    } else {
      setMessage({ type: 'success', content: 'Logged out successfully!' })
      form.resetFields()
    }
  }

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto' }}>
      {user ? (
        <div>
          <Title level={4}>当前用户</Title>
          <Text>{user.email}</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleLogout} danger>
              退出登录
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {message && (
            <Alert
              message={message.content}
              type={message.type}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form
              form={form}
              onFinish={handleLogin}
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Form
              onFinish={handleSignup}
              layout="vertical"
            >
              <Form.Item
                name="signupEmail"
                label="注册邮箱"
                rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="signupPassword"
                label="注册密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>

              <Form.Item>
                <Button 
                  htmlType="submit" 
                  loading={loading}
                  disabled={loading}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </div>
      )}
    </Card>
  )
}

export default SupabaseAuth