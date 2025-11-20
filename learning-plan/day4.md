# Day 4: 数据可视化和统计功能

## 学习目标
- 创建数据可视化组件
- 实现待办事项统计功能
- 集成实时数据展示

## 具体步骤

### 1. 创建数据可视化组件 (45分钟)
创建 `src/components/DataVisualization.tsx`：
```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface TodoStats {
  total: number
  completed: number
  pending: number
  completionRate: number
}

const DataVisualization: React.FC = () => {
  const [stats, setStats] = useState<TodoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 获取所有待办事项统计
      const { data: allTodos, error: allError } = await supabase
        .from('todos')
        .select('*')

      if (allError) throw allError

      // 获取已完成待办事项
      const { data: completedTodos, error: completedError } = await supabase
        .from('todos')
        .select('*')
        .eq('completed', true)

      if (completedError) throw completedError

      if (allTodos) {
        const total = allTodos.length
        const completed = completedTodos?.length || 0
        const pending = total - completed
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

        setStats({
          total,
          completed,
          pending,
          completionRate
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">数据统计</h2>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">待办事项统计</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">总计</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">已完成</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">待完成</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
          <div className="text-sm text-gray-600">完成率</div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          任务完成进度
        </div>
      </div>
    </div>
  )
}

export default DataVisualization
```

### 2. 集成到仪表板页面 (15分钟)
修改 `src/pages/Dashboard.tsx`，在认证组件后添加数据可视化：
```typescript
// 在导入部分添加
import DataVisualization from '../components/DataVisualization'

// 在 JSX 中，认证组件后添加
<div className="mb-8">
  <SupabaseAuth />
</div>

<DataVisualization />

// 完整的组件结构更新
```

### 3. 实现实时数据更新 (30分钟)
- 添加数据变化监听器
- 实现统计信息的实时更新
- 优化数据获取性能

### 4. 样式优化和响应式设计 (25分钟)
- 优化组件样式
- 添加响应式布局
- 确保在不同屏幕尺寸下的良好显示

### 5. 高级数据查询 (30分钟)
实现更复杂的数据分析：
```sql
-- 在 Supabase SQL 编辑器中测试以下查询
SELECT 
  COUNT(*) as total_todos,
  COUNT(*) FILTER (WHERE completed = true) as completed_todos,
  COUNT(*) FILTER (WHERE completed = false) as pending_todos,
  ROUND(
    (COUNT(*) FILTER (WHERE completed = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100
  ) as completion_rate
FROM todos 
WHERE user_id = auth.uid();
```

### 6. 错误处理和边界情况 (15分钟)
- 处理空数据情况
- 添加数据加载错误处理
- 优化用户体验

### 7. 测试和验证 (15分钟)
- 测试统计数据准确性
- 验证实时更新功能
- 确认响应式设计工作正常

### 8. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加数据可视化: 统计图表和实时更新功能"
```

## 学习资源
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [React Performance Optimization](https://react.dev/reference/react/useMemo)
- [Data Visualization Best Practices](https://www.data-to-viz.com/)

## 今日目标检查
- [ ] 数据可视化组件创建完成
- [ ] 统计功能准确显示
- [ ] 实时数据更新工作正常
- [ ] 响应式设计适配良好
- [ ] 错误处理机制完善
