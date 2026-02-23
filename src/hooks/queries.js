import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { getKeralaLocations, getLocationById, getWeatherBundle, emptyAlerts, emptyRisk } from '../lib/openMeteo'

const isTestEnv = import.meta.env.MODE === 'test'
const hasPrimaryApi = isTestEnv || !!import.meta.env.VITE_API_URL

export const useLocations = () =>
  useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get('/locations')
          return res.data?.locations || []
        } catch (_e) {
          // fall through to open data fallback
        }
      }
      return await getKeralaLocations()
    },
  })

export const useLocationDetail = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['locations', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/locations/${id}`)
          return res.data?.location || null
        } catch (_e) {
          // fallback below
        }
      }
      return (await getLocationById(id)) || null
    },
  })

export const useWeather = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/weather/${id}`)
          return res.data || {}
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      return bundle.weather || {}
    },
    staleTime: 0,
  })

export const useHourly = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'hourly'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/weather/${id}/hourly`)
          return res.data?.hours || []
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      return bundle.hourlyData || []
    },
    staleTime: 0,
  })

export const useForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/weather/${id}/forecast`)
          return res.data?.forecast || []
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      return bundle.forecast3 || []
    },
    staleTime: 0,
  })

export const useExtendedForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast14'],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/weather/${id}/forecast14`)
          return res.data?.forecast || []
        } catch (_e) {
          // fallback below
        }
      }
      const bundle = await getWeatherBundle(id)
      return bundle.forecast14 || []
    },
    staleTime: 0,
  })

export const useAlerts = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['alerts', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/alerts/${id}`)
          return res.data?.alerts || []
        } catch (_e) {
          // fallback below
        }
      }
      return await emptyAlerts(id)
    },
    staleTime: 0,
  })

export const useRisk = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['risk', id],
    queryFn: async () => {
      if (hasPrimaryApi) {
        try {
          const res = await api.get(`/disaster-risk/${id}`)
          return res.data?.risk || {}
        } catch (_e) {
          // fallback below
        }
      }
      return (await emptyRisk(id)) || {}
    },
    staleTime: 0,
  })

// Kerala monthly climate averages (used as fallback when backend is unavailable)
const keralaClimateFallback = [
  { month: 'Jan', avgHigh: 31, avgLow: 22, rainfall: 18 },
  { month: 'Feb', avgHigh: 33, avgLow: 23, rainfall: 25 },
  { month: 'Mar', avgHigh: 34, avgLow: 25, rainfall: 42 },
  { month: 'Apr', avgHigh: 34, avgLow: 26, rainfall: 120 },
  { month: 'May', avgHigh: 33, avgLow: 26, rainfall: 220 },
  { month: 'Jun', avgHigh: 30, avgLow: 24, rainfall: 490 },
  { month: 'Jul', avgHigh: 29, avgLow: 23, rainfall: 580 },
  { month: 'Aug', avgHigh: 29, avgLow: 23, rainfall: 430 },
  { month: 'Sep', avgHigh: 30, avgLow: 23, rainfall: 260 },
  { month: 'Oct', avgHigh: 30, avgLow: 23, rainfall: 310 },
  { month: 'Nov', avgHigh: 30, avgLow: 23, rainfall: 170 },
  { month: 'Dec', avgHigh: 30, avgLow: 22, rainfall: 50 },
]

export const useClimateTrends = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['climate-trends', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/climate/${id}/historical`)
        return res.data.trends
      } catch (_e) {
        return keralaClimateFallback
      }
    },
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
          const res = await api.get('/favorites')
          const list = res.data?.favorites || []
          return list.filter((id) => validIds.size === 0 || validIds.has(id))
        } catch (_e) {
          // fallback below
        }
      }
      return loadLocalFavorites().filter((id) => validIds.size === 0 || validIds.has(id))
    },
    staleTime: 0,
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
