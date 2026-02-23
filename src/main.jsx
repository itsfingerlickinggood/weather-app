import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/auth'
import { UIProvider } from './context/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
})

const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <UIProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </UIProvider>
    </StrictMode>,
  )
}

const shouldUseMocks = import.meta.env.VITE_USE_MSW === 'true'

async function enableMocks() {
  if (shouldUseMocks) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocks()
  .then(renderApp)
  .catch((error) => {
    console.error('Failed to start MSW', error)
    renderApp()
  })
