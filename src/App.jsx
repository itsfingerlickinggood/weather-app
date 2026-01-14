import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AdminCitiesPage from './pages/AdminCitiesPage'
import AdminFeedbackPage from './pages/AdminFeedbackPage'
import AdminUsagePage from './pages/AdminUsagePage'
import AQIPage from './pages/AQIPage'
import AlertsPage from './pages/AlertsPage'
import ComparisonPage from './pages/ComparisonPage'
import Dashboard from './pages/Dashboard'
import LocationPage from './pages/LocationPage'
import LoginPage from './pages/LoginPage'
import RadarPage from './pages/RadarPage'
import SeasonalInsightsPage from './pages/SeasonalInsightsPage'
import StoryTimelinePage from './pages/StoryTimelinePage'
import UVPage from './pages/UVPage'
import TripPlannerPage from './pages/TripPlannerPage'
import ForecastPage from './pages/ForecastPage'
import MapsPage from './pages/MapsPage'
import SavedCitiesPage from './pages/SavedCitiesPage'
import SettingsPage from './pages/SettingsPage'
import FeedbackPage from './pages/FeedbackPage'
import AdminRoute from './routes/AdminRoute'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <Layout>
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
    </Layout>
  )
}

export default App
