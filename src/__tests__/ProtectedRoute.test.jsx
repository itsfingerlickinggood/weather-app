import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../routes/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import { AuthProvider } from '../context/auth'
import { UIProvider } from '../context/ui'

describe('ProtectedRoute', () => {
  const renderWithProviders = () => {
    const client = new QueryClient()
    return render(
      <QueryClientProvider client={client}>
        <UIProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/secure']}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/secure" element={<div>Secret</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </UIProvider>
      </QueryClientProvider>,
    )
  }

  it('redirects to login when unauthenticated', async () => {
    renderWithProviders()
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument()
    })
  })
})
