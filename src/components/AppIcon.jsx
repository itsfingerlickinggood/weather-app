const paths = {
  brand: 'M12 3l7.5 4.2v9.6L12 21l-7.5-4.2V7.2L12 3zm0 0v18m-7.5-4.2L12 12l7.5 4.8',
  today: 'M4 11h16M4 7h16M6 4v4m12-4v4M6 20h12a2 2 0 0 0 2-2V9H4v9a2 2 0 0 0 2 2z',
  forecast: 'M5 6h14M5 12h14M5 18h14',
  maps: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zm6-2v14m6-12v14',
  aqi: 'M4 18h16M7 18V9m5 9V6m5 12v-4',
  trip: 'M4 9h16M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2m-11 0v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9',
  feedback: 'M5 5h14v10H9l-4 4V5z',
  saved: 'M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2z',
  settings: 'M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4.8L9.3 6a7 7 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.3 3h4.8l.3-3a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z',
  adminUsage: 'M5 18V8m5 10V5m5 13v-7m4 7H3',
  adminCities: 'M4 20h16M6 20V9l6-4 6 4v11M9 12h.01M12 12h.01M15 12h.01',
  adminFeedback: 'M4 5h16v10h-8l-4 4v-4H4V5z',
  moon: 'M15 3a8.5 8.5 0 1 0 6 14 7 7 0 1 1-6-14z',
  sun: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4 6.4-1.4-1.4M7 7 5.6 5.6m12.8 0L17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  shield: 'M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z',
  checklist: 'M9 7h10M9 12h10M9 17h10M4.5 7l1.5 1.5L8.5 6M4.5 12l1.5 1.5L8.5 11M4.5 17l1.5 1.5L8.5 16',
  clock: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  droplet: 'M12 3C9.5 7 6 9.8 6 13a6 6 0 0 0 12 0c0-3.2-3.5-6-6-10z',
  wind: 'M3 8h10a2 2 0 1 0-2-2M3 12h14a2 2 0 1 1-2 2M3 16h8a2 2 0 1 0-2 2',
  thermometer: 'M10 6a2 2 0 1 1 4 0v7a4 4 0 1 1-4 0V6zM12 10v6',
  pulse: 'M3 12h4l2-4 3 8 2-4h7',
  alert: 'M12 4l8 14H4l8-14zm0 5v4m0 3h.01',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 11a3 3 0 1 0 0-6M22 19a4 4 0 0 0-3-3.9',
  wallet: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V7zm0 2h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm12 4h3',
  close: 'M6 6l12 12M18 6 6 18',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
}

const AppIcon = ({ name, className = 'h-4 w-4', strokeWidth = 1.8 }) => {
  const path = paths[name]
  if (!path) return null

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path.split('M').filter(Boolean).map((segment, idx) => (
        <path key={`${name}-${idx}`} d={`M${segment}`} />
      ))}
    </svg>
  )
}

export default AppIcon