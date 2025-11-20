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
import React, { useEffect } from 'react'
import { Card, Upload, Button, Table, message, Progress, Space, Typography, Modal } from 'antd'
import { UploadOutlined, DownloadOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import { useStore } from '../stores'
import { makeAutoObservable } from 'mobx'

const { Title, Text } = Typography

interface FileItem {
  id: string
  name: string
  path: string
  public_url: string
  size: number
  type: string
  created_at: string
}

// 创建 FileStore
class FileStore {
  files: FileItem[] = []
  uploading: boolean = false
  progress: number = 0

  constructor() {
    makeAutoObservable(this)
  }

  fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      this.files = data || []
    } catch (error: any) {
      message.error('获取文件列表失败: ' + error.message)
    }
  }

  uploadFile = async (file: File) => {
    try {
      this.uploading = true
      this.progress = 0

      // 生成唯一的文件名
      const fileName = `${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          upsert: true,
          onProgress: (progressEvent) => {
            this.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
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

      await this.fetchFiles()
      message.success('文件上传成功')
    } catch (error: any) {
      message.error('文件上传失败: ' + error.message)
    } finally {
      this.uploading = false
      this.progress = 0
    }
  }

  deleteFile = async (path: string, id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件吗？此操作不可恢复。',
      onOk: async () => {
        try {
          // 从存储中删除文件
          await supabase.storage.from('uploads').remove([path])
          
          // 从数据库中删除记录
          await supabase.from('files').delete().eq('id', id)
          
          await this.fetchFiles()
          message.success('文件删除成功')
        } catch (error: any) {
          message.error('删除文件失败: ' + error.message)
        }
      },
    })
  }

  downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 更新 rootStore
rootStore.fileStore = new FileStore()

const FileUpload: React.FC = () => {
  const { fileStore } = useStore()

  useEffect(() => {
    fileStore.fetchFiles()
  }, [])

  const handleFileUpload = async (file: File) => {
    await fileStore.uploadFile(file)
    return false // 阻止默认上传行为
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => (
        <Space>
          <FileOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        <Text type="secondary">{(size / 1024 / 1024).toFixed(2)} MB</Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Text type="secondary">{type}</Text>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text type="secondary">{new Date(date).toLocaleString('zh-CN')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileItem) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => fileStore.downloadFile(record.public_url, record.name)}
          >
            下载
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => fileStore.deleteFile(record.path, record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card style={{ marginBottom: 24 }}>
      <Title level={3}>文件上传</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload
          beforeUpload={handleFileUpload}
          showUploadList={false}
          accept="*/*"
        >
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={fileStore.uploading}
            disabled={fileStore.uploading}
          >
            {fileStore.uploading ? `上传中... ${fileStore.progress}%` : '选择文件上传'}
          </Button>
        </Upload>

        {fileStore.uploading && (
          <Progress
            percent={fileStore.progress}
            status="active"
            showInfo
          />
        )}

        <Table
          columns={columns}
          dataSource={fileStore.files}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: '暂无文件',
          }}
        />
      </Space>
    </Card>
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
