import { observer } from 'mobx-react-lite'
import Dashboard from './pages/Dashboard'
import { StoreProvider } from './components/StoreProvider'

function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </StoreProvider>
  )
}

export default observer(App)
