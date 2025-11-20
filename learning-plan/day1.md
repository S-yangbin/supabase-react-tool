# Day 1: 项目初始化和环境搭建

## 学习目标
- 创建 Vite + React + TypeScript 项目
- 配置开发环境
- 安装和配置 Supabase 客户端

## 具体步骤

### 1. 创建项目 (30分钟)
```bash
# 创建项目目录
mkdir supabase-react-tool
cd supabase-react-tool

# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest . -- --template react-ts

# 安装依赖
npm install
```

### 2. 项目结构初始化 (15分钟)
- 检查生成的项目结构
- 理解 Vite 配置文件
- 设置基本的目录结构：
  ```
  src/
  ├── components/
  ├── pages/
  └── lib/
  ```

### 3. 启动开发服务器 (10分钟)
```bash
# 启动开发服务器
npm run dev

# 验证项目正常运行
# 浏览器打开 http://localhost:5173
```

### 4. 安装 Supabase 客户端 (10分钟)
```bash
# 安装 Supabase JavaScript 客户端
npm install @supabase/supabase-js
```

### 5. 创建 Supabase 配置文件 (20分钟)
创建 `src/lib/supabase.ts`：
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 6. 配置环境变量 (10分钟)
创建 `.env.example` 文件：
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. 代码提交 (5分钟)
```bash
git init
git add .
git commit -m "初始项目搭建: Vite + React + TypeScript + Supabase"
```

## 学习资源
- [Vite 快速开始](https://vitejs.dev/guide/)
- [Supabase 客户端初始化](https://supabase.com/docs/guides/getting-started/quickstarts/react)

## 今日目标检查
- [ ] 项目成功创建并运行
- [ ] Supabase 客户端正确安装
- [ ] 环境变量配置完成
- [ ] 代码结构清晰整洁
- [ ] 了解 Vite 和 React 基础概念
