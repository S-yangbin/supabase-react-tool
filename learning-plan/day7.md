# Day 7: 安全加固和监控集成

## 学习目标
- 实施安全最佳实践
- 集成错误监控
- 添加性能监控
- 配置生产环境安全策略

## 具体步骤

### 1. API 安全策略配置 (45分钟)
增强 `supabase-react-tool/learning-plan/day7/security-enhancements.md`：

#### 数据库安全增强
```sql
-- 增强用户权限控制
CREATE POLICY "Allow individual access" ON todos
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 创建安全函数限制
CREATE FUNCTION public.check_user_owns_todo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION '用户不能操作不属于自己的待办事项';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 应用安全函数到表
CREATE TRIGGER todos_security_check
    BEFORE INSERT OR UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION public.check_user_owns_todo();
```

#### Supabase 安全配置
```typescript
// src/lib/supabase-security.ts
import { supabase } from './supabase'

// 请求拦截器 - 添加安全头部
export const secureSupabase = supabase;

// 数据验证函数
export const validateTodoData = (data: any) => {
  const maxTitleLength = 200;
  const allowedChars = /^[a-zA-Z0-9\u4e00-\u9fa5\s.,!?;:'"-]+$/; // 允许中文、英文、数字和常见标点
  
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('待办事项标题不能为空');
  }
  
  if (data.title.length > maxTitleLength) {
    throw new Error(`待办事项标题不能超过 ${maxTitleLength} 个字符`);
  }
  
  if (!allowedChars.test(data.title)) {
    throw new Error('待办事项标题包含不允许的字符');
  }
  
  return true;
};

// 安全的数据操作函数
export const secureTodoOperations = {
  create: async (title: string) => {
    validateTodoData({ title });
    
    return await supabase
      .from('todos')
      .insert([{ 
        title, 
        completed: false,
        user_id: (await supabase.auth.getUser()).data.user?.id 
      }])
      .select();
  },
  
  update: async (id: string, updates: any) => {
    if (updates.title) {
      validateTodoData({ title: updates.title });
    }
    
    return await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
  }
};
```

### 2. 错误监控集成 (60分钟)
安装监控工具：
```bash
npm install @sentry/react @sentry/tracing
```

创建 `src/lib/error-monitoring.ts`：
```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Sentry 配置
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1, // 10% 的错误会被发送
  environment: import.meta.env.MODE || 'development',
  maxValueLength: 1000,
  beforeBreadcrumb: (breadcrumb, hint) => {
    // 过滤敏感信息
    if (breadcrumb.category === 'console') {
      const message = breadcrumb.message || '';
      if (message.includes('password') || message.includes('token')) {
        return null;
      }
    }
    return breadcrumb;
  }
});

// 自定义错误边界
export const withErrorBoundary = (Component: React.ComponentType) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, componentStack, resetError }) => (
      <div className="error-boundary">
        <h2>出现错误</h2>
        <details className="error-details">
          <summary>错误详情</summary>
          <p><strong>错误信息:</strong> {error.message}</p>
          <p><strong>组件栈:</strong></p>
          <pre>{componentStack}</pre>
        </details>
        <button onClick={resetError}>重新加载</button>
      </div>
    ),
  });
};

export default Sentry;
```

修改 `src/main.tsx` 添加错误监控：
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from './lib/error-monitoring'

// 包装应用根组件
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
```

### 3. 性能监控 (40分钟)
创建 `src/lib/performance-monitoring.ts`：
```typescript
import { supabase } from './supabase'

// 性能监控类
class PerformanceMonitor {
  private metrics: any[] = []
  
  startTimer(operation: string) {
    const startTime = performance.now()
    return {
      stop: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        this.recordMetric({
          operation,
          duration,
          timestamp: new Date().toISOString(),
          memory: (performance as any).memory?.usedJSHeapSize || 0
        })
        
        return duration
      }
    }
  }
  
  recordMetric(metric: any) {
    this.metrics.push(metric)
    
    // 限制历史记录数量
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50)
    }
    
    // 发送到监控服务（开发时可以打印）
    if (import.meta.env.MODE === 'production') {
      this.sendToMonitoring(metric)
    } else {
      console.log('Performance Metric:', metric)
    }
  }
  
  async sendToMonitoring(metric: any) {
    // 发送到自定义监控端点或第三方服务
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }
  
  getMetrics() {
    return this.metrics
  }
  
  clearMetrics() {
    this.metrics = []
  }
}

export const perfMonitor = new PerformanceMonitor()

// 数据库操作性能监控
export const monitoredDatabaseOperations = {
  select: async (table: string, query: any) => {
    const timer = perfMonitor.startTimer(`db_select_${table}`)
    try {
      const result = await supabase.from(table).select(query)
      timer.stop()
      return result
    } catch (error) {
      timer.stop()
      throw error
    }
  },
  
  insert: async (table: string, data: any) => {
    const timer = perfMonitor.startTimer(`db_insert_${table}`)
    try {
      const result = await supabase.from(table).insert(data)
      timer.stop()
      return result
    } catch (error) {
      timer.stop()
      throw error
    }
  },
  
  update: async (table: string, data: any, condition: any) => {
    const timer = perfMonitor.startTimer(`db_update_${table}`)
    try {
      const result = await supabase.from(table).update(data).match(condition)
      timer.stop()
      return result
    } catch (error) {
      timer.stop()
      throw error
    }
  }
}
```

### 4. 安全头配置 (20分钟)
更新 `index.html` 添加安全头：
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://*.sentry.io;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    <title>Supabase 工具仪表板</title>
    <meta name="description" content="基于 Supabase 和 React 的待办事项管理工具">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5. 用户行为分析 (30分钟)
创建 `src/lib/user-analytics.ts`：
```typescript
class UserAnalytics {
  private userId: string | null = null
  
  initialize() {
    // 获取或生成用户ID
    this.userId = localStorage.getItem('user_tracking_id')
    if (!this.userId) {
      this.userId = this.generateUserId()
      localStorage.setItem('user_tracking_id', this.userId)
    }
  }
  
  private generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }
  
  trackEvent(eventName: string, properties: any = {}) {
    const event = {
      userId: this.userId,
      eventName,
      timestamp: new Date().toISOString(),
      properties,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    }
    
    // 发送到分析服务
    if (import.meta.env.MODE === 'production') {
      this.sendEvent(event)
    } else {
      console.log('Analytics Event:', event)
    }
  }
  
  private async sendEvent(event: any) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }
  
  trackPageView() {
    this.trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title
    })
  }
  
  trackUserAction(action: string, context: any = {}) {
    this.trackEvent('user_action', {
      action,
      context
    })
  }
}

export const analytics = new UserAnalytics()
```

### 6. 安全测试 (20分钟)
创建安全测试用例：
```bash
# 创建测试文件 src/__tests__/security.test.ts
```

```typescript
import { test, expect } from 'vitest'
import { validateTodoData, secureTodoOperations } from '../lib/supabase-security'

test('验证恶意输入被拒绝', () => {
  expect(() => validateTodoData({ title: '<script>alert("xss")</script>' })).toThrow()
  expect(() => validateTodoData({ title: 'A'.repeat(300) })).toThrow()
  expect(() => validateTodoData({ title: '正常标题' })).not.toThrow()
})
```

### 7. 部署和验证 (15分钟)
- 部署到生产环境
- 验证安全功能正常工作
- 测试错误监控和性能监控

### 8. 文档更新 (10分钟)
更新安全配置文档，记录所有安全措施。

### 9. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加安全加固: API安全策略和监控集成"
```

## 学习资源
- [OWASP 安全指南](https://owasp.org/www-project-top-ten/)
- [Sentry 错误监控](https://docs.sentry.io/platforms/javascript/guides/react/)
- [CSP 指南](https://content-security-policy.com/)

## 今日目标检查
- [ ] API 安全策略配置完成
- [ ] 错误监控集成
- [ ] 性能监控实现
- [ ] 安全头部配置
- [ ] 用户行为分析添加
- [ ] 安全测试用例创建
