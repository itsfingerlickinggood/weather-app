import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import LocationPage from '../pages/LocationPage'
import { AuthProvider } from '../context/auth'
import { UIProvider } from '../context/ui'
import api from '../lib/api'
import { SESSION_KEY } from '../localUsers'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 0 } } })
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

afterEach(() => {
  vi.restoreAllMocks()
})

const mockApiForLocation = () => {
  vi.spyOn(api, 'get').mockImplementation((url) => {
    if (url === '/locations/tvm') {
      return Promise.resolve({ data: { location: { id: 'tvm', name: 'Thiruvananthapuram', region: 'Kerala', lat: 8.5241, lon: 76.9366 } } })
    }
    if (url === '/weather/tvm') {
      return Promise.resolve({ data: { temp: 31, feelsLike: 34, summary: 'Sea breeze with stray showers', aqi: 58, uv: 7, humidity: 82, wind: 18, precip: 0.22, currentTime: new Date().toISOString(), sunrise: new Date().toISOString(), sunset: new Date().toISOString() } })
    }
    if (url === '/weather/tvm/hourly') {
      return Promise.resolve({ data: { hours: [{ hour: 1, temp: 30, precip: 0.2 }, { hour: 2, temp: 30, precip: 0.15 }, { hour: 3, temp: 29, precip: 0.1 }] } })
    }
    if (url === '/weather/tvm/forecast') {
      return Promise.resolve({ data: { forecast: [{ day: 'Tue', high: 32, low: 25, precip: 0.3 }, { day: 'Wed', high: 31, low: 24, precip: 0.2 }, { day: 'Thu', high: 30, low: 24, precip: 0.2 }] } })
    }
    if (url === '/weather/tvm/forecast14') {
      return Promise.resolve({ data: { forecast: Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, high: 31, low: 24, precip: 0.2 })) } })
    }
    if (url === '/alerts/tvm') {
      return Promise.resolve({ data: { alerts: [] } })
    }
    if (url === '/disaster-risk/tvm') {
      return Promise.resolve({ data: { risk: { flood: 0.2, heat: 0.4, wind: 0.1, aqi: 0.3 } } })
    }
    if (url === '/favorites') {
      return Promise.resolve({ data: { favorites: [] } })
    }
    return Promise.reject(new Error(`Unhandled test GET ${url}`))
  })
}

describe('LocationPage', () => {
  it('renders MSW weather data after loading', async () => {
    mockApiForLocation()

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: '2', email: 'user@example.com', roles: ['user'], name: 'Uma User' }),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Current$/i })).toBeInTheDocument()
      expect(screen.getByText(/Alert status/i)).toBeInTheDocument()
    })
  })
})
