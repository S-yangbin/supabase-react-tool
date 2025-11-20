# Day 6: 高级功能扩展 - 实时数据和文件存储

## 学习目标
- 实现实时数据同步功能
- 集成文件存储功能
- 添加高级数据库查询

## 具体步骤

### 1. 实时数据订阅配置 (45分钟)
修改 `src/pages/Dashboard.tsx` 添加实时功能：
```typescript
import { useEffect, useRef } from 'react'

const Dashboard: React.FC = () => {
  // ... 现有状态
  const realtimeChannelRef = useRef<any>(null)

  useEffect(() => {
    // 设置实时数据监听
    const setupRealtime = async () => {
      realtimeChannelRef.current = supabase
        .channel('todos-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'todos',
          },
          (payload) => {
            setTodos(prevTodos => [payload.new, ...prevTodos])
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'todos',
          },
          (payload) => {
            setTodos(prevTodos =>
              prevTodos.map(todo =>
                todo.id === payload.new.id ? payload.new : todo
              )
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'todos',
          },
          (payload) => {
            setTodos(prevTodos =>
              prevTodos.filter(todo => todo.id !== payload.old.id)
            )
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      // 清理实时连接
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [])

  // ... 其他现有代码
}
```

### 2. 文件存储功能实现 (60分钟)
创建 `src/components/FileUpload.tsx`：
```typescript
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      // 生成唯一的文件名
      const fileName = `${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          upsert: true,
          onProgress: (progressEvent) => {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
          }
        })

      if (error) throw error

      // 获取文件公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      // 将文件信息保存到数据库
      await supabase.from('files').insert({
        name: file.name,
        path: fileName,
        public_url: publicUrl,
        size: file.size,
        type: file.type
      })

      setFile(null)
      fetchFiles() // 刷新文件列表
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const deleteFile = async (path: string, id: string) => {
    try {
      // 从存储中删除文件
      await supabase.storage.from('uploads').remove([path])
      
      // 从数据库中删除记录
      await supabase.from('files').delete().eq('id', id)
      
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">文件上传</h2>
      
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="flex-1"
        />
        <button
          onClick={uploadFile}
          disabled={!file || uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {uploading ? '上传中...' : '上传'}
        </button>
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">{progress}%</div>
        </div>
      )}

      <div className="space-y-2">
        {files.map(file => (
          <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-gray-500">
                {new Date(file.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                下载
              </a>
              <button
                onClick={() => deleteFile(file.path, file.id)}
                className="text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileUpload
```

### 3. 创建文件存储数据表 (20分钟)
在 Supabase SQL 编辑器中执行：
```sql
-- 创建 files 表
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can insert their own files" ON files
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files" ON files
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false);
```

### 4. 集成文件上传组件 (15分钟)
修改 `src/pages/Dashboard.tsx` 添加文件上传组件：
```typescript
import FileUpload from '../components/FileUpload'

// 在 JSX 中添加
<DataVisualization />
<FileUpload />
```

### 5. 高级查询功能 (30分钟)
创建 `src/lib/supabase-queries.ts`：
```typescript
import { supabase } from './supabase'

// 复杂的统计查询
export const getTodoStats = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_todo_statistics', {
    user_id_input: userId
  })
  
  if (error) throw error
  return data
}

// 创建数据库函数（在 Supabase SQL 编辑器中）
export const todoStatsFunctionSQL = `
CREATE OR REPLACE FUNCTION get_todo_statistics(user_id_input UUID)
RETURNS TABLE(
  total_count BIGINT,
  completed_count BIGINT,
  pending_count BIGINT,
  completion_rate NUMERIC,
  avg_completion_time INTERVAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE completed = true)::BIGINT as completed_count,
    COUNT(*) FILTER (WHERE completed = false)::BIGINT as pending_count,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as completion_rate,
    AVG(
      CASE 
        WHEN completed = true AND created_at IS NOT NULL 
        THEN created_at - created_at 
        ELSE NULL 
      END
    ) as avg_completion_time
  FROM todos 
  WHERE user_id = user_id_input;
END;
$$;
`

// 按日期范围查询
export const getTodosByDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### 6. 测试实时功能 (20分钟)
- 测试实时数据同步
- 验证文件上传功能
- 确认用户隔离正常工作

### 7. 错误处理和边界情况 (15分钟)
- 添加实时连接错误处理
- 实现文件上传错误处理
- 优化用户体验

### 8. 代码提交 (5分钟)
```bash
git add .
git commit -m "添加高级功能: 实时数据和文件存储"
```

## 学习资源
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

## 今日目标检查
- [ ] 实时数据订阅功能正常
- [ ] 文件上传/下载功能完整
- [ ] 高级查询功能实现
- [ ] 数据库函数创建成功
- [ ] 用户权限控制正常
