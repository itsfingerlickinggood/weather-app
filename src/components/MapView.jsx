import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'

// Esri World Imagery (satellite) + Esri Reference Labels overlay
// Free, no API key required — visually identical to Mapbox Satellite Streets
const MAP_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.esri.com/" target="_blank">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite-base', type: 'raster', source: 'satellite' },
    { id: 'street-labels',  type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.9 } },
  ],
}

// Colors chosen to be vivid and legible against satellite imagery
const layerPaints = {
  precip: {
    core: {
      id: 'intensity-core',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0,   '#00e5ff',   // electric cyan  — light rain
          40,  '#0284c7',   // sky blue       — moderate
          80,  '#1e40af',   // deep blue      — heavy
          160, '#3730a3',   // indigo         — very heavy
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 22, 50, 34, 100, 48, 200, 64],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.82,
      },
    },
    glow: {
      id: 'intensity-glow',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0, '#00e5ff', 80, '#0284c7', 160, '#1e40af',
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 44, 50, 62, 100, 84, 200, 110],
        'circle-opacity': 0.22,
        'circle-blur': 0.75,
      },
    },
  },
  aqi: {
    core: {
      id: 'intensity-core',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0,   '#22c55e',   // bright green   — good
          60,  '#eab308',   // golden yellow  — moderate
          100, '#f97316',   // orange         — unhealthy
          160, '#ef4444',   // vivid red      — hazardous
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 22, 75, 36, 125, 50, 200, 64],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.82,
      },
    },
    glow: {
      id: 'intensity-glow',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0, '#22c55e', 80, '#eab308', 150, '#f97316', 200, '#ef4444',
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 44, 80, 68, 140, 88, 200, 110],
        'circle-opacity': 0.22,
        'circle-blur': 0.75,
      },
    },
  },
  uv: {
    core: {
      id: 'intensity-core',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0,   '#fde047',   // bright yellow  — low UV
          50,  '#fb923c',   // amber-orange   — moderate
          80,  '#f97316',   // vivid orange   — high
          110, '#dc2626',   // red            — extreme
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 22, 60, 34, 90, 46, 120, 60],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.82,
      },
    },
    glow: {
      id: 'intensity-glow',
      type: 'circle',
      paint: {
        'circle-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0, '#fde047', 60, '#fb923c', 90, '#f97316', 120, '#dc2626',
        ],
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 44, 60, 62, 90, 78, 120, 96],
        'circle-opacity': 0.22,
        'circle-blur': 0.75,
      },
    },
  },
}

const SOURCE_ID = 'intensity'

let pulseInjected = false
const injectPulseStyle = () => {
  if (pulseInjected) return
  pulseInjected = true
  const style = document.createElement('style')
  style.textContent = `
    @keyframes map-marker-pulse {
      0%   { box-shadow: 0 0 0 0   rgba(14,165,233,0.7); }
      70%  { box-shadow: 0 0 0 12px rgba(14,165,233,0);   }
      100% { box-shadow: 0 0 0 0   rgba(14,165,233,0);   }
    }
    .map-city-dot { animation: map-marker-pulse 2s ease-out infinite; }
  `
  document.head.appendChild(style)
}

// White pill label + sky-blue caret — sharp contrast on satellite imagery
const createMarkerElement = (name) => {
  injectPulseStyle()
  const el = document.createElement('div')
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;user-select:none;'
  el.innerHTML = `
    <div style="
      background:rgba(255,255,255,0.97);
      color:#0f172a;
      font-size:11px;
      font-weight:800;
      padding:4px 12px;
      border-radius:9999px;
      white-space:nowrap;
      box-shadow:0 3px 16px rgba(0,0,0,0.55),0 1px 4px rgba(0,0,0,0.35);
      letter-spacing:0.04em;
      font-family:system-ui,-apple-system,sans-serif;
      border:2px solid #0ea5e9;
    ">${name}</div>
    <svg width="10" height="7" viewBox="0 0 10 7" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-top:-1px;flex-shrink:0;">
      <path d="M5 7L0 0h10z" fill="rgba(255,255,255,0.97)"/>
    </svg>
    <div class="map-city-dot" style="
      width:10px;height:10px;
      background:#0ea5e9;
      border:2.5px solid #fff;
      border-radius:50%;
      margin-top:-1px;
      box-shadow:0 1px 6px rgba(0,0,0,0.5);
    "></div>
  `
  return el
}

const MapView = ({ center = [76.5, 10.0], zoom = 8, points = [], layer = 'precip', marker = null }) => {
  const mapRef    = useRef(null)
  const mlRef     = useRef(null)
  const containerRef = useRef(null)
  const markerRef = useRef(null)
  const layerRef  = useRef(layer)
  const [error, setError] = useState('')

  // ── Initialize map once on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let mapInstance

    const init = async () => {
      try {
        const maplibre = await import('maplibre-gl')
        mlRef.current = maplibre

        mapInstance = new maplibre.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center,
          zoom,
          attributionControl: false,
        })

        mapInstance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
        mapInstance.addControl(new maplibre.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left')
        mapInstance.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right')

        mapInstance.on('load', () => {
          mapInstance.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          const sl = layerPaints[layerRef.current] || layerPaints.precip
          mapInstance.addLayer({ ...sl.glow, source: SOURCE_ID })
          mapInstance.addLayer({ ...sl.core, source: SOURCE_ID })
        })

        mapRef.current = mapInstance
      } catch (err) {
        console.error(err)
        setError('Map failed to load.')
      }
    }

    init()

    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      if (mapInstance) mapInstance.remove()
      mapRef.current = null
      mlRef.current  = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fly to new city when center/zoom changes ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.flyTo({ center, zoom, duration: 900, essential: true })
  }, [center, zoom])

  // ── Swap weather layer when type changes ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.loaded()) return
    layerRef.current = layer
    try {
      if (map.getLayer('intensity-core')) map.removeLayer('intensity-core')
      if (map.getLayer('intensity-glow')) map.removeLayer('intensity-glow')
      const sl = layerPaints[layer] || layerPaints.precip
      map.addLayer({ ...sl.glow, source: SOURCE_ID })
      map.addLayer({ ...sl.core, source: SOURCE_ID })
    } catch (_e) { /* ignore during init */ }
  }, [layer])

  // ── Update GeoJSON data ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map?.getSource?.(SOURCE_ID)) return
    map.getSource(SOURCE_ID).setData({
      type: 'FeatureCollection',
      features: points.map((pt) => ({
        type: 'Feature',
        properties: { intensity: pt.intensity || 0 },
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
      })),
    })
  }, [points])

  // ── Single city marker ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    const ml  = mlRef.current

    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    if (!map || !ml || !marker) return

    const el = createMarkerElement(marker.name)
    markerRef.current = new ml.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([marker.lon, marker.lat])
      .addTo(map)
  }, [marker])

  return (
    <div className="relative">
      {error ? <p className="mb-1 text-xs text-red-300">{error}</p> : null}
      <div
        ref={containerRef}
        className="h-[460px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
      />
    </div>
  )
}

export default MapView
