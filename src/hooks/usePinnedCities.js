import { useEffect, useState } from 'react'

const storageKey = 'awi_pinned_cities'

export const usePinnedCities = () => {
  const [pinned, setPinned] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : ['tvm', 'cok']
    } catch (error) {
      console.error('Unable to read pinned cities', error)
      return []
    }
  })

  // Auto-clean any non-string or empty ids to reduce bad fetches
  useEffect(() => {
    setPinned((prev) => prev.filter((id) => typeof id === 'string' && id.trim().length > 0))
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(pinned))
  }, [pinned])

  const addPin = (id) => setPinned((prev) => (prev.includes(id) ? prev : [...prev, id]))
  const removePin = (id) => setPinned((prev) => prev.filter((item) => item !== id))

  return { pinned, addPin, removePin }
}
