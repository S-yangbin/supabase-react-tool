# Day 2: Supabase 基础配置和认证系统 - 学习笔记

## 1. Supabase 项目创建与配置

### 项目创建
- 在 Supabase Dashboard 创建了新项目实例
- 记录了项目 URL 和 anon key
- 将密钥配置到 `.env` 文件中，使用环境变量管理敏感信息

### 环境变量配置
- 使用 `VITE_SUPABASE_URL` 存储项目 URL
- 使用 `VITE_SUPABASE_ANON_KEY` 存储匿名访问密钥
- 通过 `env-validator.ts` 验证环境变量的正确性

## 2. 数据库表设计与 RLS 配置

### todos 表结构
```sql
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 行级权限 (Row Level Security)
- **作用**: 根据 policy 控制表中每一行数据的访问权限
- **启用**: `ALTER TABLE todos ENABLE ROW LEVEL SECURITY;`

### RLS 策略实现
- **策略规则**: 增删改查操作都只能访问登录用户 uid 与表格中 user_id 字段值一致的数据行
- **策略语句**:
  ```sql
  -- 插入权限
  CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- 查询权限
  CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  -- 更新权限
  CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

  -- 删除权限
  CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
  ```

### Policy 实现机制
- **USING**: 类似在执行的 SQL 语句中追加 WHERE 条件
- **CHECK**: 类似在插入后验证插入结果是否符合验证条件

## 3. 认证系统实现

### SupabaseAuth 组件功能
- **未登录状态**: 展示登录注册界面
- **已登录状态**: 展示当前登录用户信息和退出登录按钮

### 核心 API 方法
- **`supabase.auth.getSession()`**: 获取当前登录用户的 session，包含用户 id、邮箱等信息
- **`supabase.auth.onAuthStateChange()`**: 监听用户登录和登出状态变化
- **`supabase.auth.signInWithPassword()`**: 完成用户密码登录操作
- **`supabase.auth.signUp()`**: 完成用户注册操作
- **`supabase.auth.signOut()`**: 完成用户登出操作

### 认证状态管理
- **JWT Token**: 登录后 Supabase 生成 JWT token 保存到客户端 localStorage
- **自动验证**: 后续请求自动在 Authorization 头中携带 token 给服务端验证
- **多页面同步**: `onAuthStateChange` 监听 localStorage 状态变化，确保多页面间状态同步

### 邮件认证流程
- 配置邮件登录方式后，注册时邮箱会收到激活邮件
- 点击激活链接后才能使用账户

## 4. 功能验证
- 启动 Vite 开发服务器进行功能测试
- 验证了用户注册、登录、登出功能正常工作
- 确认认证状态正确显示和管理
