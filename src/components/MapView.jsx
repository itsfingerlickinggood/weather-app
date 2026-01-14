import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'

const DEFAULT_STYLE = (tileKey) => ({
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [tileKey ? `https://tile.openstreetmap.org/{z}/{x}/{y}.png?key=${tileKey}` : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
})

const layerPaints = {
  precip: {
    core: {
      id: 'precip-core',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#67e8f9', 50, '#38bdf8', 100, '#2563eb', 160, '#1d4ed8'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 7, 50, 10, 100, 14, 200, 20],
        'circle-stroke-color': '#e0f2fe',
        'circle-stroke-width': 1.2,
        'circle-opacity': 0.75,
      },
    },
    glow: {
      id: 'precip-glow',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#67e8f9', 50, '#38bdf8', 100, '#2563eb'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 12, 50, 18, 100, 24, 200, 32],
        'circle-opacity': 0.22,
        'circle-blur': 0.65,
      },
    },
  },
  aqi: {
    core: {
      id: 'aqi-core',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#4ade80', 80, '#facc15', 120, '#f97316', 180, '#ef4444'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 7, 75, 12, 125, 16, 200, 20],
        'circle-stroke-color': '#fef9c3',
        'circle-stroke-width': 1.2,
        'circle-opacity': 0.78,
      },
    },
    glow: {
      id: 'aqi-glow',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#4ade80', 80, '#facc15', 150, '#f97316', 200, '#ef4444'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 12, 80, 20, 140, 26, 200, 34],
        'circle-opacity': 0.22,
        'circle-blur': 0.7,
      },
    },
  },
  uv: {
    core: {
      id: 'uv-core',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#22d3ee', 6, '#06b6d4', 9, '#f59e0b', 12, '#f97316'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 7, 6, 10, 9, 14, 12, 18],
        'circle-stroke-color': '#cffafe',
        'circle-stroke-width': 1.2,
        'circle-opacity': 0.78,
      },
    },
    glow: {
      id: 'uv-glow',
      type: 'circle',
      paint: {
        'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0, '#22d3ee', 6, '#06b6d4', 9, '#f59e0b', 12, '#f97316'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 12, 6, 18, 9, 24, 12, 30],
        'circle-opacity': 0.22,
        'circle-blur': 0.75,
      },
    },
  },
}

const MapView = ({ center = [77.5946, 12.9716], zoom = 4, points = [], layer = 'precip' }) => {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mapInstance
    let maplibre
    let sourceId = 'intensity'

    const init = async () => {
      if (!containerRef.current) return
      try {
        maplibre = await import('maplibre-gl')
        const tileKey = import.meta.env.VITE_MAP_TILE_KEY || ''
        mapInstance = new maplibre.Map({
          container: containerRef.current,
          style: DEFAULT_STYLE(tileKey),
          center,
          zoom,
        })
        mapInstance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
        mapInstance.on('load', () => {
          mapInstance.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: points.map((pt) => ({
                type: 'Feature',
                properties: { intensity: pt.intensity || 0 },
                geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
              })),
            },
          })
          const styleLayer = layerPaints[layer] || layerPaints.precip
          mapInstance.addLayer({ ...styleLayer.glow, source: sourceId })
          mapInstance.addLayer({ ...styleLayer.core, source: sourceId })
        })
        mapRef.current = mapInstance
      } catch (err) {
        console.error(err)
        setError('Map failed to load. Check tile key or network.')
      }
    }

    init()

    return () => {
      if (mapInstance) mapInstance.remove()
      mapRef.current = null
    }
  }, [center, layer, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource || !map.getSource('intensity')) return
    map.getSource('intensity').setData({
      type: 'FeatureCollection',
      features: points.map((pt) => ({
        type: 'Feature',
        properties: { intensity: pt.intensity || 0 },
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
      })),
    })
  }, [points])

  return (
    <div className="space-y-1">
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <div ref={containerRef} className="h-96 w-full overflow-hidden rounded-2xl border border-white/10" />
    </div>
  )
}

export default MapView
