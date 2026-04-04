import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import TimetableEditor from './pages/TimetableEditor'
import ScheduleMeeting from './pages/ScheduleMeeting'
import Attendance from './pages/Attendance'
import Profile from './pages/Profile'
import IntroAnimation from './components/IntroAnimation'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  if (!user) return <Navigate to="/auth" />
  return children
}

const App = () => {
  // Show intro once per browser session
  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem('meetsync_intro_done')
  )

  const handleIntroComplete = () => {
    sessionStorage.setItem('meetsync_intro_done', '1')
    setShowIntro(false)
  }

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timetable" element={<TimetableEditor />} />
          <Route path="/schedule" element={<ScheduleMeeting />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
