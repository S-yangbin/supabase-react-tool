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
- **创建 Cloudflare 账户**
  - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
  - 注册新账户或登录现有账户
  - 验证邮箱地址

- **连接 GitHub/GitLab 仓库**
  - 在 Cloudflare Dashboard 中选择 "Pages"
  - 点击 "Create a project" → "Connect to Git"
  - 选择 GitHub 或 GitLab 账户
  - 授权 Cloudflare 访问权限
  - 选择要部署的仓库（supabase-react-tool）

- **配置构建设置**
  - 选择框架预设：React
  - 配置构建选项：
    - **构建命令**: `npm run build`
    - **构建输出目录**: `dist`
    - **环境变量**: 配置 Supabase 相关变量
  - 添加环境变量：
    - `VITE_SUPABASE_URL`: 您的 Supabase 项目 URL
    - `VITE_SUPABASE_ANON_KEY`: 您的 Supabase 项目 anon key

- **高级设置（可选）**
  - 在 "Settings" → "Build configurations" 中可以进一步优化：
    - **Node.js 版本**: 选择最新 LTS 版本
    - **环境**: 选择 production
    - **构建缓存**: 启用以加快构建速度

- **部署配置文件**
  - 在仓库根目录创建 `wrangler.toml`：
  ```toml
  name = "supabase-react-tool"
  compatibility_date = "2024-01-01"
  pages_build_output_dir = "dist"
  
  [vars]
  # 环境变量将在 Cloudflare Pages 部署时设置
  ```

- **安全设置**
  - 在 "Settings" → "Environment Variables" 中管理敏感信息
  - 确保不将敏感信息硬编码在配置文件中
  - 使用 Cloudflare 的环境变量功能来管理 API keys

### 10. 部署验证 (10分钟)
- **首次部署**
  - 代码推送后，Cloudflare Pages 会自动触发构建
  - 在 "Deployments" 标签页查看构建日志
  - 等待构建成功完成（通常需要 2-5 分钟）

- **访问部署的应用**
  - 构建成功后，会生成默认的部署 URL
  - URL 格式：`https://<project-name>.pages.dev`
  - 也可以设置自定义域名

- **功能验证**
  - 访问部署的 URL
  - 测试以下功能：
    - 用户认证（登录/注册/退出）
    - 待办事项的增删改查
    - 数据可视化图表
    - 响应式布局
  - 检查浏览器控制台是否有错误

- **性能验证**
  - 使用浏览器开发者工具的 Network 面板检查资源加载
  - 验证代码分割是否生效
  - 检查是否有 404 错误
  - 测试页面加载速度

- **错误处理**
  - 如果构建失败，查看 Cloudflare 提供的错误日志
  - 常见问题：
    - 依赖包版本冲突
    - 环境变量未正确设置
    - 构建命令错误
    - 路径配置问题

- **持续部署**
  - 每次向 main 分支推送代码时，会自动触发新的部署
  - 可以在 "Deployments" 中查看所有部署历史
  - 可以回滚到之前的部署版本

### 11. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加部署配置: Cloudflare Pages 和性能优化"
```

### 12. 部署最佳实践 (15分钟)

- **环境变量管理**
  - 使用 `.env.production` 作为模板，实际值在 Cloudflare 控制台设置
  - 避免在代码中硬编码敏感信息
  - 定期轮换 API keys

- **构建优化**
  - 监控构建时间和文件大小
  - 使用代码分割减少初始加载大小
  - 启用 gzip 压缩
  - 优化图片资源

- **错误监控**
  - 在生产环境中添加错误监控
  - 使用 Sentry 或类似工具跟踪前端错误
  - 添加用户友好的错误提示

- **性能监控**
  - 使用 PageSpeed Insights 优化性能
  - 监控 Core Web Vitals 指标
  - 定期检查页面加载速度

- **安全考虑**
  - 定期更新依赖包
  - 使用 HTTPS
  - 配置适当的安全头
  - 限制对敏感端点的访问

### 13. 常见问题和解决方案 (20分钟)

- **构建失败常见原因**
  - **依赖包问题**: 确保 `package-lock.json` 与 `package.json` 一致
  - **环境变量**: 检查环境变量名称和值是否正确
  - **路径问题**: 确保构建输出路径与 Cloudflare 配置一致

- **部署后问题排查**
  - **404 错误**: 检查路由配置和静态资源路径
  - **API 连接失败**: 验证 Supabase URL 和密钥
  - **样式丢失**: 确认 CSS 文件正确构建

- **性能问题**
  - **加载慢**: 检查代码分割配置
  - **首屏渲染**: 优化首屏关键资源
  - **内存泄漏**: 使用 React DevTools 检查组件卸载

- **调试技巧**
  - 使用 `console.log` 在生产环境中调试
  - 查看 Cloudflare Pages 的构建日志
  - 使用浏览器开发者工具分析性能

## 学习资源
- [Cloudflare Pages 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-application/)
- [Vite 生产构建优化](https://vite.dev/guide/build.html)
- [React 性能优化](https://react.dev/reference/react/lazy)
- [Cloudflare Pages 环境变量文档](https://developers.cloudflare.com/pages/configuration/environment-variables/)
- [Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/platform/custom-domains/)

## 今日目标检查
- [ ] Cloudflare Pages 配置完成
- [ ] 构建优化配置生效
- [ ] 代码分割实现
- [ ] 性能优化完成
- [ ] 部署测试成功
- [ ] 环境变量配置正确
- [ ] 部署流程验证通过
