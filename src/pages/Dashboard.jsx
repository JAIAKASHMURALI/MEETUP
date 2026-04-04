import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

// --- INTERNAL HELPERS ---

const LiveClock = () => {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex items-center space-x-3 bg-slate-900 dark:bg-slate-950 text-white px-5 py-2.5 rounded-2xl shadow-lg border border-white/10">
      <ClockIcon size={18} className="text-emerald-500 animate-pulse" />
      <span className="font-black tabular-nums tracking-tighter text-xl italic">
        {format(time, 'HH:mm:ss')}
      </span>
    </div>
  )
}

const MiniCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = new Date()

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6 px-1">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
        {format(currentMonth, 'MMMM yyyy')}
      </h3>
      <div className="flex space-x-1">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"><ChevronLeft size={16} /></button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"><ChevronRight size={16} /></button>
      </div>
    </div>
  )

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase text-slate-400 tracking-tighter">{d}</div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const rows = []
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={`h-8 flex items-center justify-center text-[10px] font-black rounded-lg transition-all ${!isSameMonth(day, monthStart) ? 'text-slate-300 dark:text-slate-700' :
              isSameDay(day, today) ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [principalStatus, setPrincipalStatus] = useState(null)

  const newlyScheduledMeetings = meetings.filter(
    (m) => new Date(m.created_at) > addDays(new Date(), -1)
  );

  useEffect(() => {
    fetchMeetings()
    fetchPrincipalStatus()
  }, [profile])

  const fetchMeetings = async () => {
    if (!profile) return
    try {
      let query = supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (profile.role !== 'Principal') {
        query = query.eq('department', profile.department)
      }

      const { data, error } = await query.limit(5)
      if (error) throw error
      setMeetings(data || [])
    } catch (err) {
      console.error('Error fetching meetings:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPrincipalStatus = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: pProfile } = await supabase.from('profiles').select('id, name').eq('role', 'Principal').limit(1).single()

      if (pProfile) {
        const { data: pAttendance } = await supabase.from('attendance')
          .select('status')
          .eq('user_id', pProfile.id)
          .eq('date', today)
          .single()

        if (pAttendance) {
          setPrincipalStatus({ ...pProfile, status: pAttendance.status })
        } else {
          setPrincipalStatus({ ...pProfile, status: 'Unknown' })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const updatePrincipalStatus = async (status) => {
    if (profile?.role !== 'Principal') return
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      await supabase.from('attendance').upsert({
        user_id: profile.id,
        date: today,
        status: status
      })
      setPrincipalStatus(prev => ({ ...prev, status }))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Live Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white mb-2 italic tracking-tighter leading-none">
            Welcome, {profile?.name?.split(' ')[0] || 'User'}
          </h1>
          <div className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="text-emerald-600 font-black italic">{profile?.role || 'Guest'}</span>
            <span className="mx-3 opacity-30">|</span>
            <span>Department {profile?.department || 'Administration'}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <LiveClock />
          <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
          <div className="flex items-center text-[10px] font-black uppercase text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl shadow-sm italic">
            <CalendarIcon className="mr-3 text-emerald-500" size={16} />
            {format(new Date(), 'EEEE, MMMM do')}
          </div>
        </div>
      </div>

      {/* Grid for Actions + Mini Utilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Actions and Meetings */}
        <div className="lg:col-span-8 space-y-8">

          {/* Notifications Panel */}
          {newlyScheduledMeetings.length > 0 && profile?.role !== 'Principal' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center shadow-sm"
            >
              <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg mr-4 flex-shrink-0">
                <AlertCircle size={20} className="text-amber-600 dark:text-amber-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest italic leading-tight">Notification Alert</h4>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mt-0.5">
                  HOD has announced {newlyScheduledMeetings.length} new meeting(s) for the {profile.department} department.
                </p>
              </div>
            </motion.div>
          )}

          {/* Primary Actions Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/schedule')}
              className="p-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-between group"
            >
              <div className="text-left">
                <p className="text-[10px] font-black uppercase opacity-60 mb-2 italic tracking-widest">COORDINATE MEETS</p>
                <h3 className="text-2xl font-black italic">Launch Scheduler</h3>
              </div>
              <Plus size={36} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/timetable')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 transition-all group"
              >
                <CalendarIcon className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors mb-3" size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white italic">My Timetable</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 transition-all group text-center"
              >
                <LayoutDashboard className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors mb-3" size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white italic leading-tight">Attendance Records</span>
              </button>
            </div>
          </div>

          {/* Stats Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Upcoming', value: meetings.length, icon: ClockIcon, color: 'text-blue-600' },
              { label: 'Staff in Unit', value: profile?.role === 'Principal' ? '24' : '8', icon: Users, color: 'text-emerald-600' },
              { label: 'System Alerts', value: newlyScheduledMeetings.length.toString(), icon: AlertCircle, color: 'text-amber-500' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center space-x-6">
                <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white tabular-nums italic tracking-tighter">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Meeting Agenda Table */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] flex items-center italic mb-4 opacity-70">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 animate-pulse" />
              Latest Departmental Agenda
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic animate-pulse">Syncing institutional records...</div>
              ) : meetings.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="p-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Schedule</th>
                      <th className="p-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Subject</th>
                      <th className="p-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {meetings.map((meeting) => (
                      <tr key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-all group">
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <p className="font-black text-slate-950 dark:text-white text-xs uppercase italic">{format(new Date(meeting.date), 'MMM dd')}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tabular-nums tracking-tighter">{meeting.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-black italic text-slate-900 dark:text-white uppercase text-xs tracking-tight">{meeting.title}</p>
                          <p className="text-[9px] font-medium text-slate-500 line-clamp-1 italic">{meeting.agenda}</p>
                        </td>
                        <td className="p-4 text-right">
                          <button className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-500 transition-all italic">Explore</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center opacity-40">
                  <CalendarIcon className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} strokeWidth={1} />
                  <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 italic">No coordinated meets on record.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Monthly Calendar */}
        <div className="lg:col-span-4 space-y-8">
          <MiniCalendar />

          {/* Principal Status Card */}
          <div className={`p-8 rounded-2xl shadow-xl relative overflow-hidden group transition-all text-white ${!principalStatus ? 'bg-slate-800' :
            (principalStatus.status === 'Busy' || principalStatus.status === 'Absent' ? 'bg-red-600 shadow-red-600/20' :
              principalStatus.status === 'Present' || principalStatus.status === 'Available' || principalStatus.status === 'Free' ? 'bg-emerald-600 shadow-emerald-600/20' :
                'bg-blue-600 shadow-blue-600/20')
            }`}>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4 italic flex justify-between items-center">
                <span>Principal Status</span>
                {profile?.role === 'Principal' && <span className="bg-white/20 px-2 py-0.5 rounded text-[8px]">YOUR STATUS</span>}
              </h4>
              <p className="text-3xl font-black italic mb-1 uppercase tracking-tighter">{principalStatus?.status || 'Active'}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 border-b border-white/20 pb-4 mb-4">{principalStatus?.name || 'Loading Name...'}</p>

              {profile?.role === 'Principal' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updatePrincipalStatus('Available')} className="py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-black text-[9px] uppercase tracking-widest italic transition-colors">Mark Free</button>
                  <button onClick={() => updatePrincipalStatus('Busy')} className="py-2.5 bg-black/20 hover:bg-black/30 rounded-lg font-black text-[9px] uppercase tracking-widest italic transition-colors text-red-100">Mark Busy</button>
                  <button onClick={() => updatePrincipalStatus('Present')} className="py-2.5 bg-emerald-900/40 hover:bg-emerald-900/60 rounded-lg font-black text-[9px] uppercase tracking-widest italic transition-colors">Mark Present</button>
                  <button onClick={() => updatePrincipalStatus('Absent')} className="py-2.5 bg-red-900/40 hover:bg-red-900/60 rounded-lg font-black text-[9px] uppercase tracking-widest italic transition-colors text-red-100">Mark Absent</button>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Info Card */}
          <div className="p-8 bg-slate-950 rounded-2xl text-white shadow-2xl shadow-slate-950/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6 italic">Academic Focus</h4>
              <p className="text-sm font-bold leading-relaxed italic mb-8">Maintain 100% institutional compliance through digital attendance records and real-time coordination.</p>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Verified Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
