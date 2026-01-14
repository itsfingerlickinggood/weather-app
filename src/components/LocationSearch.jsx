import { useEffect, useMemo, useState } from 'react'

const normalize = (v = '') => v.trim().toLowerCase()

const LocationSearch = ({ locations = [], value, onChange, label = 'Location', placeholder = 'Search city', id = 'location-search' }) => {
  const [input, setInput] = useState('')

  // Keep input text in sync with selected value
  useEffect(() => {
    const match = locations.find((l) => l.id === value)
    setInput(match ? match.name : '')
  }, [locations, value])

  const listId = `${id}-datalist`

  const handleCommit = () => {
    const term = normalize(input)
    if (!term) return
    const exact = locations.find((l) => normalize(l.name) === term || normalize(l.id) === term)
    const partial = locations.find((l) => normalize(l.name).includes(term))
    const chosen = exact || partial
    if (chosen) onChange?.(chosen.id)
  }

  const options = useMemo(() => locations.slice(0, 50), [locations])

  return (
    <label className="text-sm text-slate-200 w-full">
      <span className="mr-2 text-xs uppercase text-slate-400">{label}</span>
      <input
        id={id}
        className="focus-ring w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
        list={listId}
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleCommit()
          }
        }}
      />
      <datalist id={listId}>
        {options.map((loc) => (
          <option key={loc.id} value={loc.name} />
        ))}
      </datalist>
    </label>
  )
}

export default LocationSearch

