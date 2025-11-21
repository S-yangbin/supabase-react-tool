import React from 'react'
import { Card, Row, Col, Statistic, Progress, Typography } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { useStore } from '../stores'
import { observer } from 'mobx-react-lite'

const { Title } = Typography

const DataVisualization: React.FC = () => {
  const { todoStore } = useStore()

  const { stats } = todoStore

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
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Progress
          percent={stats.completionRate}
          size={20}
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <div style={{ marginTop: 8, textAlign: 'center' as const }}>
          任务完成进度
        </div>
      </div>
    </Card>
  )
}

export default observer(DataVisualization)
