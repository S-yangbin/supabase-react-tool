# Day 3: 数据库 CRUD 操作和待办事项功能

## 学习目标
- 实现数据库的增删改查操作
- 创建待办事项管理功能
- 集成数据操作到 React 组件

## 具体步骤

### 1. 创建待办事项页面 (60分钟)
创建 `src/pages/Dashboard.tsx`：
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SupabaseAuth from '../components/SupabaseAuth'

interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
}

const Dashboard: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ title: newTodo, completed: false }])
        .select()

      if (error) throw error

      if (data) {
        setTodos([data[0], ...todos])
        setNewTodo('')
      }
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Supabase 工具仪表板</h1>
      
      <div className="mb-8">
        <SupabaseAuth />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">待办事项</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="添加新的待办事项..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <button
            onClick={addTodo}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
          >
            添加
          </button>
        </div>

        {loading ? (
          <p>加载中...</p>
        ) : (
          <ul className="space-y-2">
            {todos.map(todo => (
              <li key={todo.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="mr-3"
                  />
                  <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                    {todo.title}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}

        {todos.length === 0 && !loading && (
          <p className="text-gray-500 text-center py-4">暂无待办事项</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
```

### 2. 更新主应用组件 (15分钟)
修改 `src/App.tsx`：
```typescript
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
    </div>
  )
}

export default App
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
