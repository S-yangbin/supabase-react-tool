import React from 'react'
import { observer } from 'mobx-react-lite'
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useStore } from '../stores'

const { Title, Text } = Typography

interface AuthFormValues {
  email: string
  password: string
}

const SupabaseAuth: React.FC = () => {
  const { authStore } = useStore()
  const [form] = Form.useForm()

  const handleLogin = async (values: AuthFormValues) => {
    const success = await authStore.handleLogin(values.email, values.password)
    if (success) {
      form.resetFields()
    }
  }

  const handleSignup = async (values: AuthFormValues) => {
    const success = await authStore.handleSignup(values.email, values.password)
    if (success) {
      form.resetFields()
    }
  }

  const handleLogout = async () => {
    const success = await authStore.handleLogout()
    if (success) {
      form.resetFields()
    }
  }

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto' }}>
      {authStore.user ? (
        <div>
          <Title level={4}>当前用户</Title>
          <Text>{authStore.user.email}</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleLogout} danger loading={authStore.loading}>
              退出登录
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {authStore.message && (
            <Alert
              message={authStore.message.content}
              type={authStore.message.type}
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
                  loading={authStore.loading}
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
                  loading={authStore.loading}
                  disabled={authStore.loading}
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

export default observer(SupabaseAuth)
