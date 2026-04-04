import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Briefcase, Building2, Eye, EyeOff, Sun, Moon, CheckCircle, ShieldAlert, Zap } from 'lucide-react'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, loginAsGuest } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Teacher',
    department: 'CSE',
    customDepartment: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
      } else {
        const { error: signUpError } = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.role,
          formData.role === 'Principal' ? null : (formData.department === 'Others' ? formData.customDepartment : formData.department)
        )
        if (signUpError) throw signUpError
        alert('Verification email sent! Check your inbox to confirm.')
        setIsLogin(true)
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // SIMPLE METHOD: One-click bypass for development
  const handleDemoLogin = () => {
    loginAsGuest('Principal')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <img src="/logo.png" alt="MeetSync Logo" className="w-9 h-9 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform object-cover" />
          <span className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">MeetSync</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Toggle Theme</span>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* Auth Card Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl relative z-10"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
              {isLogin ? 'Sign In' : 'Join Now'}
            </h1>
            <p className="text-sm text-slate-500 font-medium italic">
              {isLogin ? 'Welcome back! Sync your departmental agenda.' : 'Register and maintain your academic logs.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-bold flex items-start">
              <ShieldAlert className="mr-3 flex-none" size={18} />
              <div className="flex-1">
                <p className="mb-1">{error}</p>
                {error.includes('confirmed') && (
                  <p className="text-[10px] uppercase font-black opacity-80 mt-2 text-red-500 border-t border-red-200 pt-2">
                    Tip: Try the "Quick Demo" button below to bypass this.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Display Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm"
                    />
                  </div>

                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm appearance-none"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="HOD">HOD</option>
                      <option value="Principal">Principal</option>
                    </select>
                  </div>

                  {formData.role !== 'Principal' && (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm appearance-none"
                        >
                          <option value="CSE">CSE</option>
                          <option value="IT">IT</option>
                          <option value="ECE">ECE</option>
                          <option value="EEE">EEE</option>
                          <option value="MECH">MECH</option>
                          <option value="CIVIL">CIVIL</option>
                          <option value="AI&DS">AI&DS</option>
                          <option value="ALML">ALML</option>
                          <option value="CSBS">CSBS</option>
                          <option value="BME">BME</option>
                          <option value="AERO">AERO</option>
                          <option value="AUTO">AUTO</option>
                          <option value="CHEM">CHEM</option>
                          <option value="BIOTECH">BIOTECH</option>
                          <option value="B.Arch">B.Arch</option>
                          <option value="Pharm">Pharm</option>
                          <option value="MBA">MBA</option>
                          <option value="MCA">MCA</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {formData.department === 'Others' && (
                        <div className="relative group">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            name="customDepartment"
                            type="text"
                            required
                            placeholder="Type your department"
                            value={formData.customDepartment}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="email"
                type="email"
                required
                placeholder="Institutional Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Security Pass"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center italic"
            >
              {loading ? 'Processing...' : (isLogin ? 'Confirm Login' : 'Confirm Registration')}
            </button>
          </form>

          {/* SIMPLE METHOD: QUICK DEMO BUTTON */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleDemoLogin}
              className="w-full py-4 rounded-xl border-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 active:scale-95 transition-all flex items-center justify-center italic group"
            >
              <Zap size={16} className="mr-2 text-amber-500 group-hover:scale-125 transition-transform" />
              ⚡ Enter as Demo Guest (Bypass)
            </button>
            <p className="text-[9px] font-bold text-center mt-3 text-slate-400 uppercase tracking-widest italic leading-relaxed">
              Use this if you haven't disabled email confirmation in Supabase settings.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-500">
              {isLogin ? "New to MeetSync?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-emerald-600 font-black hover:underline italic"
              >
                {isLogin ? 'Register Here ' : 'Login Here'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 opacity-60 flex flex-col items-center space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-12 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <div className="text-center sm:text-left leading-none"><span className="text-slate-900 dark:text-white block mb-2">ARAVINDHAN R</span><span className="text-emerald-500 opacity-100 italic">Frontend Designer</span></div>
          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <div className="text-center sm:text-left leading-none"><span className="text-slate-900 dark:text-white block mb-2">JAIAKASH M</span><span className="text-emerald-500 opacity-100 italic">Backend Architect</span></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">© 2026 MeetSync Academic System Hub</p>
      </footer>
    </div>
  )
}

export default Auth
