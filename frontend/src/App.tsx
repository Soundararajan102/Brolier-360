import React, { Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { LoadingScreen } from "./components/LoadingScreen"

// Dynamic route-level imports for code splitting (Performance Optimization)
const Dashboard = React.lazy(() => import("./pages/Dashboard"))
const Login = React.lazy(() => import("./pages/Login"))
const Members = React.lazy(() => import("./pages/Members"))
const Campaigns = React.lazy(() => import("./pages/Campaigns"))
const Inbox = React.lazy(() => import("./pages/Inbox"))
const Reports = React.lazy(() => import("./pages/Reports"))
const Templates = React.lazy(() => import("./pages/Templates"))
const Media = React.lazy(() => import("./pages/Media"))

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="reports" element={<Reports />} />
              <Route path="templates" element={<Templates />} />
              <Route path="media" element={<Media />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  )
}

export default App
