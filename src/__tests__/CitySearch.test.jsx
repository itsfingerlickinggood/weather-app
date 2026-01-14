import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import CitySearch from '../components/CitySearch'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const sampleLocations = [
  { id: 'cok', name: 'Kochi', region: 'Kerala, India' },
  { id: 'kol', name: 'Kolkata', region: 'West Bengal, India' },
  { id: 'tvm', name: 'Thiruvananthapuram', region: 'Kerala, India' },
]

vi.mock('../hooks/queries', () => ({
  useLocations: () => ({ data: sampleLocations, isLoading: false }),
}))

describe('CitySearch', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('prioritizes Kerala cities and supports keyboard selection', async () => {
    render(<CitySearch />)

    const input = screen.getByLabelText(/search by city/i)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'ko' } })

    const options = await screen.findAllByRole('option')
    expect(options[0]).toHaveTextContent('Kochi')
    expect(options[1]).toHaveTextContent('Kolkata')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith('/locations/cok')
  })

  it('falls back to best match on submit without explicit highlight', async () => {
    render(<CitySearch />)
    const input = screen.getByLabelText(/search by city/i)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'thiru' } })

    fireEvent.submit(input.closest('form'))
    expect(mockNavigate).toHaveBeenCalledWith('/locations/tvm')
  })

  it('shows error when no city matches', async () => {
    render(<CitySearch />)
    const input = screen.getByLabelText(/search by city/i)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'zzz' } })

    fireEvent.submit(input.closest('form'))
    expect(await screen.findByText(/city not found/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
