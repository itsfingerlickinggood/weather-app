import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocations } from '../hooks/queries'
import { searchWeatherApi } from '../lib/liveWeather'
import { registerDynamicLocation, geocodeGenericCity } from '../lib/openMeteo'

const normalize = (value = '') => value.trim().toLowerCase()

const scoreLocation = (loc, term) => {
  const name = normalize(loc.name)
  const region = normalize(loc.region || '')
  const id = normalize(loc.id || '')
  const tokens = term.split(/\s+/).filter(Boolean)

  let score = 0
  const isKerala = region.includes('kerala')
  if (isKerala) score += 60

  tokens.forEach((tok) => {
    if (!tok) return
    if (name.startsWith(tok)) score += 40
    else if (name.includes(tok)) score += 25
    if (region.startsWith(tok) || region.includes(tok)) score += 15
    if (id === tok) score += 20
  })

  // Small boost for full exact match
  if (normalize(`${loc.name}, ${loc.region}`) === term) score += 20
  return score
}

const CitySearch = ({ compact = false, onSelect }) => {
  const navigate = useNavigate()
  const { data: locations = [], isLoading } = useLocations()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  const ranked = useMemo(() => {
    if (!locations.length) return []
    const term = normalize(query)
    // Show top Kerala cities by default; otherwise rank by score
    if (!term) {
      return [...locations]
        .sort((a, b) => scoreLocation(b, 'kerala') - scoreLocation(a, 'kerala'))
        .slice(0, 8)
    }

    return locations
      .map((loc) => ({
        loc,
        score: scoreLocation(loc, term),
        matches: normalize(loc.name).includes(term) || normalize(loc.region || '').includes(term) || normalize(loc.id).includes(term),
      }))
      .filter((item) => item.matches)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.loc)
      .slice(0, 8)
  }, [locations, query])

  useEffect(() => {
    if (!open) return
    setActiveIndex(ranked.length ? 0 : -1)
  }, [open, ranked.length])

  const selectLocation = async (loc) => {
    if (!loc) {
      try {
        const results = await searchWeatherApi({ q: query || undefined })
        const first = results?.[0]
        if (first) {
          const slug = `q-${encodeURIComponent(first.name || query || 'city')}`
          const dynamicLoc = registerDynamicLocation({
            id: slug,
            name: first.name,
            region: [first.region, first.country].filter(Boolean).join(', '),
            lat: first.lat,
            lon: first.lon,
            provider: 'weatherapi',
            tags: ['Live city'],
            zone: first.region || first.country || 'Live city',
          })
          setError('')
          setOpen(false)
          setQuery(dynamicLoc.name)
          navigate(`/locations/${dynamicLoc.id}`)
          onSelect?.(dynamicLoc)
          return
        }
        // Fallback to Open-Meteo geocoder for global cities
        const geoLoc = await geocodeGenericCity(query)
        if (geoLoc) {
          setError('')
          setOpen(false)
          setQuery(geoLoc.name)
          navigate(`/locations/${geoLoc.id}`)
          onSelect?.(geoLoc)
          return
        }
      } catch (err) {
        console.warn('Live search failed', err)
      }
      setError('City not found in catalog.')
      return
    }
    setError('')
    setOpen(false)
    setQuery(loc.name)
    navigate(`/locations/${loc.id}`)
    onSelect?.(loc)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fallback = ranked[activeIndex] || ranked[0]
    selectLocation(fallback)
  }

  const handleKeyDown = (e) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      setOpen(true)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1 >= ranked.length ? 0 : prev + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 < 0 ? ranked.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectLocation(ranked[activeIndex] || ranked[0])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const assistiveId = 'city-search-help'
  const listboxId = 'city-search-listbox'

  const popular = locations.slice(0, 6)

  return (
    <form className={`flex flex-1 flex-col gap-1 ${compact ? '' : 'max-w-xl'}`} onSubmit={handleSubmit}>
      <div
        className="flex flex-col gap-1"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listboxId}
      >
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="city-search">
            Search by city
          </label>
          <input
            ref={inputRef}
            id="city-search"
            className="focus-ring w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            placeholder={isLoading ? 'Loading cities…' : 'Search city or region'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setError('')
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-describedby={assistiveId}
          />
          <button
            type="submit"
            className="focus-ring rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isLoading}
          >
            Find
          </button>
        </div>
        <p id={assistiveId} className="text-[11px] text-slate-400">
          Kerala-first ranking • type then use ↑/↓ and Enter to select. Esc closes suggestions.
        </p>
        {open ? (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="relative z-10 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/90 shadow-xl shadow-black/40"
          >
            {ranked.length ? (
              ranked.map((loc, idx) => {
                const active = idx === activeIndex
                return (
                  <button
                    key={loc.id}
                    id={`${listboxId}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-start gap-2 border-b border-white/5 px-3 py-2 text-left text-sm text-slate-100 last:border-b-0 ${
                      active ? 'bg-blue-600/80 text-white' : 'hover:bg-white/5'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectLocation(loc)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="font-semibold">{loc.name}</span>
                    <span className="text-xs text-slate-300">{loc.region}</span>
                    {normalize(loc.region || '').includes('kerala') ? (
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100">Kerala-first</span>
                    ) : null}
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-2 text-sm text-slate-300">No matches found. Try Kerala cities like Kochi or TVM.</p>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {popular.map((loc) => (
          <button
            key={loc.id}
            type="button"
            className="focus-ring rounded-full bg-white/5 px-3 py-1"
            onClick={() => selectLocation(loc)}
          >
            {loc.name}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-amber-200">{error}</p> : null}
    </form>
  )
}

export default CitySearch
