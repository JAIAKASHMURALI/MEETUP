import React from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Briefcase, Building2, ShieldCheck, LogOut, Award, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const Profile = () => {
  const { profile, user, signOut } = useAuth()
  
  if (!profile) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-1">My Account</h1>
        <p className="text-sm text-slate-500 font-medium italic">Manage your academic profile and institutional credentials.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Simple Banner */}
        <div className="h-24 bg-slate-900 dark:bg-slate-950 flex items-center px-10">
           <div className="text-xs font-black uppercase text-emerald-500 tracking-[0.4em] italic opacity-50">Profile Header</div>
        </div>

        <div className="p-8 sm:p-10 relative">
           {/* Avatar placeholder */}
           <div className="absolute top-[-40px] left-10 w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-200 shadow-lg">
              <User size={48} strokeWidth={1.5} />
           </div>

           <div className="pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic mb-1">{profile.name}</h2>
                <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-emerald-600">
                   <span>{profile.role}</span>
                   <span className="text-slate-300">•</span>
                   <span className="text-slate-500">{profile.department || 'Administration'}</span>
                </div>
              </div>
              
              <button 
                onClick={() => signOut()}
                className="px-6 py-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black italic text-[10px] uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                Sign Out System
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Name', value: profile.name, icon: User },
                { label: 'Role', value: profile.role, icon: Award },
                { label: 'Unit', value: profile.department || 'Primary Office', icon: Building2 },
                { label: 'Email', value: user.email, icon: Mail },
              ].map((info, i) => (
                <div key={i} className="flex items-center space-x-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                   <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700">
                      <info.icon size={18} strokeWidth={2.5} />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{info.label}</p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{info.value}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="p-8 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4">
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Account History</p>
            <p className="text-sm font-bold italic">User registered on {format(new Date(user.created_at), 'MMMM yyyy')}</p>
         </div>
         <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Verified System Endpoint</span>
         </div>
      </div>
    </div>
  )
}

export default Profile
