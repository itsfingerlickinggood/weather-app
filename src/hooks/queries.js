import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api, { fetchWithCache } from '../lib/api'

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
      const { data, offline } = await fetchWithCache('locations', async () => {
        const res = await api.get('/locations')
        return res.data?.locations || []
      })
      const list = data || []
      list.offline = offline
      return list
    },
  })

export const useLocationDetail = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['locations', id],
    queryFn: async () => {
        const { data, offline } = await fetchWithCache(`location-${id}`, async () => {
          const res = await api.get(`/locations/${id}`)
          return res.data?.location || null
        })
        if (!data) return null
        return { ...data, offline }
    },
  })

export const useWeather = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id],
    queryFn: async () => {
      const { data, offline } = await fetchWithCache(`weather-${id}`, async () => (await api.get(`/weather/${id}`)).data || {})
      return { ...(data || {}), offline }
    },
  })

export const useHourly = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'hourly'],
    queryFn: async () => withOfflineFlag(await fetchWithCache(`hourly-${id}`, async () => (await api.get(`/weather/${id}/hourly`)).data?.hours || [])),
  })

export const useForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast'],
    queryFn: async () => withOfflineFlag(await fetchWithCache(`forecast-${id}`, async () => (await api.get(`/weather/${id}/forecast`)).data?.forecast || [])),
  })

export const useExtendedForecast = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['weather', id, 'forecast14'],
    queryFn: async () => withOfflineFlag(await fetchWithCache(`forecast14-${id}`, async () => (await api.get(`/weather/${id}/forecast14`)).data?.forecast || [])),
  })

export const useAlerts = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['alerts', id],
    queryFn: async () => withOfflineFlag(await fetchWithCache(`alerts-${id}`, async () => (await api.get(`/alerts/${id}`)).data?.alerts || [])),
  })

export const useRisk = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: ['risk', id],
    queryFn: async () => withOfflineFlag(await fetchWithCache(`risk-${id}`, async () => (await api.get(`/disaster-risk/${id}`)).data?.risk || {})),
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

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const result = await fetchWithCache('favorites', async () => (await api.get('/favorites')).data.favorites)
      const filtered = (result.data || []).filter((id) => validIds.size === 0 || validIds.has(id))
      const copy = [...filtered]
      copy.offline = result.offline
      return copy
    },
  })

  const addFavorite = useMutation({
    mutationFn: async (locationId) => {
      const { data } = await api.post('/favorites', { locationId })
      return data.favorites
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
      const { data } = await api.delete('/favorites', { data: { locationId } })
      return data.favorites
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
