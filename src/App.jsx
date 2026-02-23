import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Skeleton from './components/Skeleton'
import AdminRoute from './routes/AdminRoute'
import ProtectedRoute from './routes/ProtectedRoute'

// Route-level code splitting: each page is a separate JS chunk
const AdminCitiesPage = lazy(() => import('./pages/AdminCitiesPage'))
const AdminFeedbackPage = lazy(() => import('./pages/AdminFeedbackPage'))
const AdminUsagePage = lazy(() => import('./pages/AdminUsagePage'))
const AQIPage = lazy(() => import('./pages/AQIPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LocationPage = lazy(() => import('./pages/LocationPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RadarPage = lazy(() => import('./pages/RadarPage'))
const SeasonalInsightsPage = lazy(() => import('./pages/SeasonalInsightsPage'))
const StoryTimelinePage = lazy(() => import('./pages/StoryTimelinePage'))
const UVPage = lazy(() => import('./pages/UVPage'))
const TripPlannerPage = lazy(() => import('./pages/TripPlannerPage'))
const ForecastPage = lazy(() => import('./pages/ForecastPage'))
const MapsPage = lazy(() => import('./pages/MapsPage'))
const SavedCitiesPage = lazy(() => import('./pages/SavedCitiesPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'))

const PageFallback = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-40" />
    <Skeleton className="h-40" />
  </div>
)

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="maps" element={<MapsPage />} />
          <Route path="saved" element={<SavedCitiesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="/locations/:id" element={<LocationPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/aqi" element={<AQIPage />} />
          <Route path="/uv" element={<UVPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/story" element={<StoryTimelinePage />} />
          <Route path="/seasonal" element={<SeasonalInsightsPage />} />
          <Route path="/trip" element={<TripPlannerPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          <Route path="/admin" element={<AdminRoute />}>
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="usage" element={<AdminUsagePage />} />
            <Route path="feedback" element={<AdminFeedbackPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
