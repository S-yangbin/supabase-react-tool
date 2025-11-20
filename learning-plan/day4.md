# Day 4: 数据可视化和统计功能

## 学习目标
- 创建数据可视化组件
- 实现待办事项统计功能
- 集成实时数据展示

## 具体步骤

### 1. 创建数据可视化组件 (45分钟)
创建 `src/components/DataVisualization.tsx`：
```typescript
import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Typography, Spin, theme } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, PercentageOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import { useStore } from '../stores'
import { makeAutoObservable } from 'mobx'

const { Title } = Typography

interface TodoStats {
  total: number
  completed: number
  pending: number
  completionRate: number
}

// 创建 StatsStore
class StatsStore {
  stats: TodoStats | null = null
  loading: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  fetchStats = async () => {
    try {
      this.loading = true
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

        this.stats = {
          total,
          completed,
          pending,
          completionRate
        }
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    } finally {
      this.loading = false
    }
  }
}

// 更新 rootStore
rootStore.statsStore = new StatsStore()

const DataVisualization: React.FC = () => {
  const { statsStore } = useStore()

  useEffect(() => {
    statsStore.fetchStats()
  }, [])

  if (statsStore.loading || !statsStore.stats) {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Spin tip="加载统计信息...">
          <div style={{ minHeight: 100 }} />
        </Spin>
      </Card>
    )
  }

  const { stats } = statsStore

  return (
    <Card style={{ marginBottom: 24 }}>
      <Title level={3}>待办事项统计</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总计"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待完成"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completionRate}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Progress
          percent={stats.completionRate}
          size="large"
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          任务完成进度
        </div>
      </div>
    </Card>
  )
}

export default DataVisualization
```

### 2. 集成到仪表板页面 (15分钟)
修改 `src/pages/Dashboard.tsx`，更新组件结构以包含数据可视化：
```typescript
// 在导入部分添加
import DataVisualization from '../components/DataVisualization'

// 在 JSX 中，Card 内部结构更新为：
<Col xs={24} md={8}>
  <Card>
    <SupabaseAuth />
  </Card>
  <div style={{ marginTop: 16 }}>
    <DataVisualization />
  </div>
</Col>

// 完整的组件结构更新已在 Day 3 中完成
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
