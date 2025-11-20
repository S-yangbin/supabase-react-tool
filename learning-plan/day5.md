# Day 5: Cloudflare Pages 部署和性能优化

## 学习目标
- 配置 Cloudflare Pages 部署
- 优化应用性能
- 设置生产环境配置

## 具体步骤

### 1. Cloudflare Pages 配置 (30分钟)
创建 `wrangler.toml` 配置文件：
```toml
name = "supabase-react-tool"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[vars]
# 环境变量将在 Cloudflare Pages 部署时设置
```

### 2. 构建配置优化 (20分钟)
修改 `vite.config.ts` 以优化生产构建：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭 sourcemap
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
```

### 3. 环境变量配置 (15分钟)
更新 `.env.production` 文件：
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### 4. 部署脚本配置 (10分钟)
在 `package.json` 中添加部署相关脚本：
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build"
  }
}
```

### 5. 性能优化 - 代码分割 (30分钟)
实现 React 组件懒加载：
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { StoreProvider } from './components/StoreProvider'

const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        }>
          <div className="min-h-screen bg-gray-50">
            <Dashboard />
          </div>
        </Suspense>
      </StoreProvider>
    </StoreProvider>
  )
}

export default App
```

### 6. 性能优化 - 数据获取优化 (25分钟)
优化数据获取策略：
```typescript
// 在 Dashboard.tsx 中添加缓存和错误重试
import { useCallback, useMemo } from 'react'

const fetchTodos = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // 限制数据量

    if (error) throw error
    setTodos(data || [])
  } catch (error) {
    console.error('Error fetching todos:', error)
    // 实现重试逻辑
  } finally {
    setLoading(false)
  }
}, [])
```

### 7. SEO 优化 (15分钟)
添加基本的 SEO 配置到 `index.html`：
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase 工具仪表板</title>
    <meta name="description" content="基于 Supabase 和 React 的待办事项管理工具">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 8. 测试构建 (20分钟)
```bash
# 测试构建
npm run build

# 测试预览
npm run preview

# 验证构建文件大小和性能
```

### 9. Cloudflare Pages 部署准备 (20分钟)
- 在 Cloudflare Pages 控制台创建新项目
- 连接 GitHub/GitLab 仓库
- 配置构建设置：
  - 构建命令：`npm run build`
  - 构建输出目录：`dist`
  - 环境变量：添加 Supabase 相关变量

### 10. 部署验证 (10分钟)
- 部署到 Cloudflare Pages
- 验证功能完整性
- 测试生产环境性能

### 11. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加部署配置: Cloudflare Pages 和性能优化"
```

## 学习资源
- [Cloudflare Pages 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-application/)
- [Vite 生产构建优化](https://vite.dev/guide/build.html)
- [React 性能优化](https://react.dev/reference/react/lazy)

## 今日目标检查
- [ ] Cloudflare Pages 配置完成
- [ ] 构建优化配置生效
- [ ] 代码分割实现
- [ ] 性能优化完成
- [ ] 部署测试成功
