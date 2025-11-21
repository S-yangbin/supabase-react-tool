import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { observer } from 'mobx-react-lite'
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
      </div>
    </StoreProvider>
  )
}

export default observer(App)
