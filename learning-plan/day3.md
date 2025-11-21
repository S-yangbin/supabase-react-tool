# Day 3: 数据库 CRUD 操作和待办事项功能

## 学习目标
- 实现数据库的增删改查操作
- 创建待办事项管理功能
- 集成数据操作到 React 组件

## 具体步骤

### 1. 创建 TodoStore (20分钟)
创建 `src/stores/todoStore.ts`：
```typescript
import { makeAutoObservable } from 'mobx'
import { supabase } from '../lib/supabase'
import { message } from 'antd'

export interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
}

export class TodoStore {
  todos: Todo[] = []
  loading: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  fetchTodos = async () => {
    try {
      this.loading = true
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      this.todos = data || []
    } catch (error: any) {
      message.error('获取待办事项失败: ' + error.message)
    } finally {
      this.loading = false
    }
  }

  addTodo = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ title, completed: false }])
        .select()

      if (error) throw error

      if (data) {
        this.todos = [data[0], ...this.todos]
        message.success('添加成功')
      }
    } catch (error: any) {
      message.error('添加待办事项失败: ' + error.message)
    }
  }

  toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      this.todos = this.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      )
      message.success(completed ? '标记为待完成' : '标记为已完成')
    } catch (error: any) {
      message.error('更新待办事项失败: ' + error.message)
    }
  }

  deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      this.todos = this.todos.filter(todo => todo.id !== id)
      message.success('删除成功')
    } catch (error: any) {
      message.error('删除待办事项失败: ' + error.message)
    }
  }
}
```

### 1.1 创建 AuthStore (15分钟)
创建 `src/stores/authStore.ts`：
```typescript
import { makeAutoObservable } from 'mobx'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { message } from 'antd'

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
```

### 2. 更新 stores/index.ts (10分钟)
修改 `src/stores/index.ts`：
```typescript
import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { TodoStore } from './todoStore'
import { AuthStore } from './authStore'

class RootStore {
  todoStore: TodoStore
  authStore: AuthStore

  constructor() {
    this.todoStore = new TodoStore()
    this.authStore = new AuthStore()
    makeAutoObservable(this)
  }
}

export const rootStore = new RootStore()

export const StoreContext = createContext<RootStore>(rootStore)

export const useStore = () => useContext(StoreContext)
```

### 3. 创建待办事项页面 (40分钟)
创建 `src/pages/Dashboard.tsx`：
```typescript
import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Layout, Typography, Input, Button, List, Checkbox, Card, Row, Col } from 'antd'
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import SupabaseAuth from '../components/SupabaseAuth'
import { useStore } from '../stores'
import type { Todo } from '../stores/todoStore'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

const Dashboard: React.FC = () => {
  const { todoStore } = useStore()
  const [newTodo, setNewTodo] = React.useState('')

  useEffect(() => {
    todoStore.fetchTodos()
  }, [])

  const handleAddTodo = () => {
    if (!newTodo.trim()) return
    todoStore.addTodo(newTodo)
    setNewTodo('')
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ lineHeight: '64px', margin: 0, color: '#1890ff' }}>
          Supabase 工具仪表板
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card>
              <SupabaseAuth />
            </Card>
          </Col>
          
          <Col xs={24} md={16}>
            <Card>
              <Title level={3}>待办事项</Title>
              
              <div style={{ marginBottom: 16 }}>
                <Search
                  placeholder="添加新的待办事项..."
                  enterButton={<Button type="primary" icon={<PlusOutlined />}>添加</Button>}
                  size="large"
                  value={newTodo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodo(e.target.value)}
                  onSearch={handleAddTodo}
                  onKeyDown={handleEnter}
                />
              </div>

              <List
                loading={todoStore.loading}
                dataSource={todoStore.todos}
                renderItem={(todo: Todo) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => todoStore.deleteTodo(todo.id)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => todoStore.toggleTodo(todo.id, todo.completed)}
                          icon={<CheckOutlined />}
                        />
                      }
                      title={
                        <Text delete={todo.completed} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                          {todo.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary">
                          {new Date(todo.created_at).toLocaleString('zh-CN')}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: '暂无待办事项'
                }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

export default observer(Dashboard)
```

### 2.1 创建 Store Provider 组件 (10分钟)
创建 `src/components/StoreProvider.tsx`：
```typescript
import React, { ReactNode } from 'react'
import { StoreContext, rootStore } from '../stores'

interface StoreProviderProps {
  children: ReactNode
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  )
}
```

### 3. 更新主应用组件 (15分钟)
修改 `src/App.tsx`：
```typescript
import React from 'react'
import Dashboard from './pages/Dashboard'
import { StoreProvider } from './components/StoreProvider'

function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </StoreProvider>
  )
}

export default observer(App)
```

### 3. 实现 CRUD 操作 (45分钟)
- **创建 (Create)**: `addTodo` 函数
- **读取 (Read)**: `fetchTodos` 函数  
- **更新 (Update)**: `toggleTodo` 函数
- **删除 (Delete)**: `deleteTodo` 函数

### 4. 错误处理和加载状态 (20分钟)
- 添加加载状态指示器
- 实现错误消息显示
- 添加输入验证

### 5. 测试功能 (20分钟)
- 测试添加待办事项
- 测试切换完成状态
- 测试删除功能
- 验证数据持久化

### 6. 代码优化 (10分钟)
- 添加 TypeScript 类型定义
- 优化异步操作错误处理
- 确保代码可读性

### 7. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加待办事项功能: CRUD 操作和页面集成"
```

## 学习资源
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL 与 Supabase](https://supabase.com/docs/guides/database/tables)
- [React Hooks 最佳实践](https://react.dev/reference/react)

## 今日目标检查
- [ ] 待办事项 CRUD 功能完整实现
- [ ] 数据操作正确同步到数据库
- [ ] 错误处理机制完善
- [ ] 用户界面友好易用
- [ ] 加载状态正常显示
