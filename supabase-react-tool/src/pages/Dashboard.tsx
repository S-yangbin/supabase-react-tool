import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Layout, Typography, Input, Button, List, Checkbox, Card, Row, Col, Alert } from 'antd'
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import SupabaseAuth from '../components/SupabaseAuth'
import { useStore } from '../stores'
import { type Todo } from '../stores/todoStore'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

const Dashboard: React.FC = () => {
  const { todoStore } = useStore()
  const [newTodo, setNewTodo] = React.useState('')

  useEffect(() => {
    todoStore.fetchTodos()
  }, [])

  const handleAddTodo = () => {
    if (!newTodo.trim()) return
    todoStore.addTodo(newTodo)
    setNewTodo('')
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ lineHeight: '64px', margin: 0, color: '#1890ff' }}>
          Supabase 工具仪表板
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card>
              <SupabaseAuth />
            </Card>
          </Col>
          
          <Col xs={24} md={16}>
            <Card>
              <Title level={3}>待办事项</Title>
              
              {todoStore.error && (
                <Alert
                  message={todoStore.error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <div style={{ marginBottom: 16 }}>
                <Search
                  placeholder="添加新的待办事项..."
                  enterButton={<Button type="primary" icon={<PlusOutlined />}>添加</Button>}
                  size="large"
                  value={newTodo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodo(e.target.value)}
                  onSearch={handleAddTodo}
                  onKeyDown={handleEnter}
                />
              </div>

              <List
                loading={todoStore.loading}
                dataSource={todoStore.todos}
                renderItem={(todo: Todo) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => todoStore.deleteTodo(todo.id)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => todoStore.toggleTodo(todo.id, todo.completed)}
                          icon={<CheckOutlined />}
                        />
                      }
                      title={
                        <Text delete={todo.completed} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                          {todo.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary">
                          {new Date(todo.created_at).toLocaleString('zh-CN')}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: '暂无待办事项'
                }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

export default observer(Dashboard)
