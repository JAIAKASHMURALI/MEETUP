import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users, Zap, Shield, ChevronRight, BarChart3, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Landing = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 flex flex-col font-sans">
      {/* Simple Navigation */}
      <nav className="w-full px-8 py-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-50">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="MeetSync Logo" className="w-10 h-10 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 object-cover" />
          <span className="text-xl font-black text-slate-950 dark:text-white italic tracking-tighter">MeetSync</span>
        </div>
        <div className="flex items-center space-x-4">
           <button 
             onClick={toggleTheme}
             className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-all shadow-sm"
             title="Toggle Theme"
           >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <button 
             onClick={() => navigate('/auth')}
             className="px-6 py-2.5 rounded-xl bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-lg italic"
           >
             Get Started
           </button>
        </div>
      </nav>

      {/* Simplified Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-slate-900 opacity-50 -z-10" />
        
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-4xl"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-10 border border-emerald-100 dark:border-emerald-800 rounded-full italic">
            <Zap size={12} fill="currentColor" />
            <span>Academic Excellence Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-8 italic">
            MeetSync <br />
            <span className="text-emerald-600 dark:text-emerald-500">"Where everyone meets!"</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium italic mb-12">
            The bridge between Principals, HODs, and Teachers. <br className="hidden md:block" />
            Coordinated scheduling driven by live departmental availability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
             <Link
               to="/auth"
               className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center group italic"
             >
               Launch Application
               <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Link>
             <a
               href="#features"
               className="px-10 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-2xl font-black text-lg hover:border-emerald-600 transition-all italic"
             >
               View Components
             </a>
          </div>
        </motion.div>
      </div>

      {/* Simple Grid Features */}
      <div id="features" className="max-w-7xl mx-auto px-4 py-32 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "Smart Scheduling", desc: "AI-driven availability calculation based on live departmental JSON timetables." },
            { title: "Role-Based Access", desc: "Tailored workflows for Principals, HODs, and Teachers for seamless coordination." },
            { title: "Attendance Tracking", desc: "Automated presence logging and administrative reports for total oversight." },
          ].map((feature, i) => (
             <div key={i} className="text-center md:text-left space-y-4">
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 mx-auto md:mx-0 shadow-sm">
                 <Shield size={24} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{feature.title}</h3>
               <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{feature.desc}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Clean Footer */}
      <footer className="py-20 border-t border-slate-100 dark:border-slate-800 opacity-50 bg-white/50 dark:bg-slate-900/50">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-12 text-[9px] font-black uppercase tracking-widest text-slate-400">
               <div className="text-center sm:text-left leading-none"><span className="text-slate-900 dark:text-white block mb-2">ARAVINDHAN R</span><span className="text-emerald-500 opacity-100 italic">Frontend Developer</span></div>
               <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
               <div className="text-center sm:text-left leading-none"><span className="text-slate-900 dark:text-white block mb-2">JAIAKASH M</span><span className="text-emerald-500 opacity-100 italic">Backend Developer</span></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">© 2026 MeetSync Academic System Hub</p>
         </div>
      </footer>
    </div>
  )
}

export default Landing
