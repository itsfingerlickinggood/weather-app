import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LocationPage from '../pages/LocationPage'
import { AuthProvider } from '../context/auth'
import { UIProvider } from '../context/ui'
import api from '../lib/api'

const renderPage = () => {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <UIProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/locations/tvm']}>
            <Routes>
              <Route path="/locations/:id" element={<LocationPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </UIProvider>
    </QueryClientProvider>,
  )
}

describe('LocationPage', () => {
  it('renders MSW weather data after loading', async () => {
    const { data } = await api.post('/auth/login', { email: 'user@example.com', password: 'password' })
    localStorage.setItem('awi_tokens', JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Current conditions/i)).toBeInTheDocument()
      expect(screen.getByText(/Sea breeze/i)).toBeInTheDocument()
    })
  })
})
