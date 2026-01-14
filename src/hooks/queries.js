import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { fetchWithCache } from '../lib/api'
import { getKeralaLocations, getLocationById, getWeatherBundle, emptyAlerts, emptyRisk } from '../lib/openMeteo'

const isTestEnv = import.meta.env.MODE === 'test'
const hasPrimaryApi = isTestEnv || !!import.meta.env.VITE_API_URL

const withOfflineFlag = (payload) => {
  const { data, offline } = payload
  if (Array.isArray(data)) {
    const copy = [...data]
    copy.offline = offline
    return copy
  }
  if (data && typeof data === 'object') return { ...data, offline }
  return data
}

export const useLocations = () =>
  useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      // Try primary API first if configured, otherwise use open-source fallback
      if (hasPrimaryApi) {
        try {
          const { data, offline } = await fetchWithCache('locations', async () => {
            const res = await api.get('/locations')
            return res.data?.locations || []
          })
          const list = data || []
          list.offline = offline
          return list
        } catch (_e) {
          // fall through to open data fallback
        }
      }

      const list = await getKeralaLocations()
      list.offline = false
      return list
    },
  })

export const useLocationDetail = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['locations', id],
    queryFn: async () => {
        if (hasPrimaryApi) {
          try {
            const { data, offline } = await fetchWithCache(`location-${id}`, async () => {
              const res = await api.get(`/locations/${id}`)
              return res.data?.location || null
            })
            if (!data) return null
            return { ...data, offline }
          } catch (_e) {
            // fallback below
          }
        }
        const fallback = await getLocationById(id)
        return fallback ? { ...fallback, offline: false } : null
    },
  })

export const useWeather = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const { data, offline } = await fetchWithCache(`weather-${id}`, async () => (await api.get(`/weather/${id}`)).data || {})
          return { ...(data || {}), offline }
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      return { ...(bundle.weather || {}), offline: false }
    },
  })

export const useHourly = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'hourly'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          return withOfflineFlag(await fetchWithCache(`hourly-${id}`, async () => (await api.get(`/weather/${id}/hourly`)).data?.hours || []))
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      const data = bundle.hourlyData || []
      const copy = [...data]
      copy.offline = false
      return copy
    },
  })

export const useForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          return withOfflineFlag(await fetchWithCache(`forecast-${id}`, async () => (await api.get(`/weather/${id}/forecast`)).data?.forecast || []))
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      const data = bundle.forecast3 || []
      const copy = [...data]
      copy.offline = false
      return copy
    },
  })

export const useExtendedForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast14'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          return withOfflineFlag(await fetchWithCache(`forecast14-${id}`, async () => (await api.get(`/weather/${id}/forecast14`)).data?.forecast || []))
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      const data = bundle.forecast14 || []
      const copy = [...data]
      copy.offline = false
      return copy
    },
  })

export const useAlerts = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['alerts', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          return withOfflineFlag(await fetchWithCache(`alerts-${id}`, async () => (await api.get(`/alerts/${id}`)).data?.alerts || []))
        } catch (_e) {
          // fallback below
        }
      }
      const data = await emptyAlerts(id)
      const copy = [...data]
      copy.offline = false
      return copy
    },
  })

export const useRisk = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['risk', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          return withOfflineFlag(await fetchWithCache(`risk-${id}`, async () => (await api.get(`/disaster-risk/${id}`)).data?.risk || {}))
        } catch (_e) {
          // fallback below
        }
      }
      const data = await emptyRisk(id)
      return { ...(data || {}), offline: false }
    },
  })

export const useClimateTrends = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['climate-trends', id],
    queryFn: async () => (await api.get(`/climate/${id}/historical`)).data.trends,
  })

export const useRadarSettings = () =>
  useQuery({
    queryKey: ['radar-settings'],
    queryFn: async () => (await api.get('/radar-settings')).data.radar,
  })

export const useAdminApiConfig = () =>
  useQuery({
    queryKey: ['admin-api-config'],
    queryFn: async () => (await api.get('/admin/api-config')).data.config,
  })

export const useAdminStoryRules = () =>
  useQuery({
    queryKey: ['admin-story-rules'],
    queryFn: async () => (await api.get('/admin/story-rules')).data.rules,
  })

export const useAdminRadarSettings = () =>
  useQuery({
    queryKey: ['admin-radar-settings'],
    queryFn: async () => (await api.get('/admin/radar-settings')).data.radar,
  })

export const useDisasterThresholds = () =>
  useQuery({
    queryKey: ['admin-disaster-thresholds'],
    queryFn: async () => (await api.get('/admin/disaster-thresholds')).data.thresholds,
  })

export const useApiHealth = () =>
  useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const { data } = await api.get('/admin/health')
      return data
    },
  })

export const useFavorites = () => {
  const queryClient = useQueryClient()
  const locations = queryClient.getQueryData(['locations']) || []
  const validIds = new Set(locations.map((l) => l.id))

  const loadLocalFavorites = () => {
    try {
      const raw = localStorage.getItem('favorites-local')
      return raw ? JSON.parse(raw) : []
    } catch (_e) {
      return []
    }
  }

  const saveLocalFavorites = (list) => {
    try {
      localStorage.setItem('favorites-local', JSON.stringify(list))
    } catch (_e) {
      // ignore
    }
  }

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const result = await fetchWithCache('favorites', async () => (await api.get('/favorites')).data.favorites)
          const filtered = (result.data || []).filter((id) => validIds.size === 0 || validIds.has(id))
          const copy = [...filtered]
          copy.offline = result.offline
          return copy
        } catch (_e) {
          // fallback below
        }
      }
      const local = loadLocalFavorites().filter((id) => validIds.size === 0 || validIds.has(id))
      const copy = [...local]
      copy.offline = false
      return copy
    },
  })

  const addFavorite = useMutation({
    mutationFn: async (locationId) => {
      if (hasPrimaryApi) {
        const { data } = await api.post('/favorites', { locationId })
        return data.favorites
      }
      const next = Array.from(new Set([...loadLocalFavorites(), locationId]))
      saveLocalFavorites(next)
      return next
    },
    onMutate: async (locationId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData(['favorites'])
      queryClient.setQueryData(['favorites'], (old = []) => Array.from(new Set([...old, locationId])))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['favorites'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const removeFavorite = useMutation({
    mutationFn: async (locationId) => {
      if (hasPrimaryApi) {
        const { data } = await api.delete('/favorites', { data: { locationId } })
        return data.favorites
      }
      const next = loadLocalFavorites().filter((id) => id !== locationId)
      saveLocalFavorites(next)
      return next
    },
    onMutate: async (locationId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData(['favorites'])
      queryClient.setQueryData(['favorites'], (old = []) => old.filter((id) => id !== locationId))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['favorites'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  return { favoritesQuery, addFavorite, removeFavorite }
}
