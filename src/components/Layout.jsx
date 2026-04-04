import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  BarChart3,
  Calendar,
  Clock,
  LogOut,
  Moon,
  Sun,
  User,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Chatbot from './Chatbot'

const Layout = () => {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'Schedule', path: '/schedule', icon: Clock },
    { label: 'Attendance', path: '/attendance', icon: ClipboardCheck },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <img src="/logo.png" alt="MeetSync Logo" className="w-9 h-9 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform object-cover" />
              <span className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">MeetSync</span>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-emerald-600'
                    }`}
                >
                  <item.icon size={18} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2" />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-xs"
                title="Toggle Dark/Light Mode"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={handleSignOut}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-red-500 hover:text-red-500 transition-all shadow-xs"
                title="Confirm Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile Actions Container */}
            <div className="md:hidden flex items-center space-x-2">
              <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-colors ${location.pathname === item.path
                      ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 font-medium'
                      }`}
                  >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-4 p-4 w-full rounded-2xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={22} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Page Layout Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="min-h-[70vh]">
          <Outlet />
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center opacity-80 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8 md:mb-0">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-slate-900 dark:text-white uppercase leading-none mb-1">ARAVINDHAN R</span>
              <span className="text-emerald-600">Frontend Developer</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-slate-900 dark:text-white uppercase leading-none mb-1">JAIAKASH M</span>
              <span className="text-emerald-600">Backend Developer</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end space-y-2">
            <p className="tracking-[0.2em]">Developed by Artificial Intelligence & Data Science students</p>
            <p className="opacity-50">© 2026 Academic Coordination Hub • Local v1.0.0</p>
          </div>
        </div>
      </footer>
      <Chatbot />
    </div>
  )
}

export default Layout
