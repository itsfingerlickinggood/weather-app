const weatherCodeToIcon = {
  0: '/icons/weather/sunny.png',
  1: '/icons/weather/cloud.png',
  2: '/icons/weather/cloud.png',
  3: '/icons/weather/cumulus-cloud.png',
  45: '/icons/weather/foggy-pier.png',
  48: '/icons/weather/foggy-pier.png',
  51: '/icons/weather/rain.png',
  53: '/icons/weather/rain.png',
  55: '/icons/weather/rain.png',
  56: '/icons/weather/rain.png',
  57: '/icons/weather/rain.png',
  61: '/icons/weather/rain.png',
  63: '/icons/weather/rain.png',
  65: '/icons/weather/rain.png',
  66: '/icons/weather/rain.png',
  67: '/icons/weather/rain.png',
  71: '/icons/weather/snow.png',
  73: '/icons/weather/snow.png',
  75: '/icons/weather/snow.png',
  77: '/icons/weather/snow.png',
  80: '/icons/weather/rain.png',
  81: '/icons/weather/rain.png',
  82: '/icons/weather/rain.png',
  85: '/icons/weather/snow.png',
  86: '/icons/weather/snow.png',
  95: '/icons/weather/bottled-lightning.png',
  96: '/icons/weather/bottled-lightning.png',
  99: '/icons/weather/bottled-lightning.png',
}

const contains = (text, words) => words.some((word) => text.includes(word))

export const resolveWeatherIcon = ({ summary = '', weathercode, precip = 0, cloudCover = null, wind = 0, uv = 0, temp = 25 } = {}) => {
  if (weathercode != null && weatherCodeToIcon[weathercode]) return weatherCodeToIcon[weathercode]

  const normalized = String(summary).toLowerCase()
  if (contains(normalized, ['thunder', 'lightning', 'storm', 'squall'])) return '/icons/weather/bottled-lightning.png'
  if (contains(normalized, ['snow', 'blizzard', 'sleet', 'ice'])) return '/icons/weather/snow.png'
  if (contains(normalized, ['hail'])) return '/icons/weather/hailstone.png'
  if (contains(normalized, ['fog', 'mist', 'haze', 'smoke'])) return '/icons/weather/foggy-pier.png'
  if (contains(normalized, ['rain', 'drizzle', 'shower', 'monsoon'])) return '/icons/weather/rain.png'
  if (contains(normalized, ['wind', 'breeze', 'gust'])) return '/icons/weather/wind.png'
  if (contains(normalized, ['cloud', 'overcast'])) return '/icons/weather/cumulus-cloud.png'
  if (contains(normalized, ['sun', 'clear', 'bright'])) return '/icons/weather/sunny.png'

  if (precip >= 0.6) return '/icons/weather/rain.png'
  if (wind >= 40) return '/icons/weather/wind.png'
  if (cloudCover != null && cloudCover >= 0.7) return '/icons/weather/cumulus-cloud.png'
  if (uv >= 7 && temp >= 28) return '/icons/weather/sunny.png'

  return '/icons/weather/cloud.png'
}
