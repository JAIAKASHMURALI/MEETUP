import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import { CheckCircle2, XCircle, Search, Filter, Calendar, Users, BarChart3, Clock, AlertCircle, Download, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const Attendance = () => {
  const { profile, user } = useAuth()
  const [attendanceList, setAttendanceList] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [todayStatus, setTodayStatus] = useState(null)
  const [deptFilter, setDeptFilter] = useState(profile?.department || 'All')

  const isPrincipal = profile?.role === 'Principal'
  const isHOD = profile?.role === 'HOD'
  const canViewOthers = isPrincipal || isHOD

  useEffect(() => {
    enforceGlobalAbsences().then(() => {
      fetchAttendance()
      if (!isPrincipal) checkTodayStatus()
    })
  }, [profile, deptFilter])

  const enforceGlobalAbsences = async () => {
    if (!profile) return
    const now = new Date()
    if (now.getHours() < 11) return

    try {
      const today = format(now, 'yyyy-MM-dd')

      const { data: allProfs } = await supabase.from('profiles').select('id, role, department')
      const { data: todayAtt } = await supabase.from('attendance').select('user_id').eq('date', today)

      const existingIds = new Set(todayAtt?.map(a => a.user_id) || [])

      const missingProfiles = allProfs?.filter(p => !existingIds.has(p.id) && p.role !== 'Principal') || []

      if (missingProfiles.length > 0) {
        const payload = missingProfiles.map(p => ({
          user_id: p.id,
          date: today,
          status: 'Absent'
        }))
        await supabase.from('attendance').upsert(payload)
      }
    } catch (err) {
      console.error('Lazy Cron Error:', err)
    }
  }

  const checkTodayStatus = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setTodayStatus(data.status)
    } catch (err) {
      console.error(err.message)
    }
  }

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('attendance')
        .select('*, profiles!inner(name, role, department)')
        .order('date', { ascending: false })

      if (isPrincipal) {
        if (deptFilter !== 'All') {
          query = query.eq('profiles.department', deptFilter)
        }
      } else if (isHOD) {
        query = query.eq('profiles.department', profile.department)
      } else {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      setAttendanceList(data.filter(item => item.profiles) || [])
    } catch (err) {
      console.error('Fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Date,Name,Role,Department,Status']
    const csvContent = attendanceList.map(record => {
      const date = format(new Date(record.date), 'MMM dd yyyy')
      const name = record.profiles?.name || 'N/A'
      const role = record.profiles?.role || 'N/A'
      const dept = record.profiles?.department || 'N/A'
      const status = record.status
      return `${date},${name},${role},${dept},${status}`
    })

    const blob = new Blob([headers.concat(csvContent).join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'attendance_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const dispatchEmail = () => {
    alert('Mock 5:00 PM Dispatch Configured! Daily Excel exports will now be automatically routed via Supabase Edge Functions.')
  }

  const markAttendance = async (status) => {
    setMarking(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { error } = await supabase
        .from('attendance')
        .upsert({
          user_id: user.id,
          date: today,
          status: status
        })

      if (error) throw error
      setTodayStatus(status)
      fetchAttendance()
    } catch (err) {
      alert(err.message)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 italic tracking-tighter">Attendance Bureau</h1>
          <p className="text-sm text-slate-500 font-medium italic">Monitor departmental presence and maintain institutional compliance records.</p>
        </div>

        {isPrincipal && (
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm">
            <Filter className="text-emerald-500" size={14} />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest pr-8 cursor-pointer"
            >
              <option value="All">All Departments</option>
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {!isPrincipal && (
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950 p-8 rounded-xl text-white shadow-xl shadow-slate-950/20 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60 italic">Daily Presence</h3>

                {todayStatus ? (
                  <div className="space-y-4">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${todayStatus === 'Present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      }`}>
                      {todayStatus === 'Present' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                    </div>
                    <p className="text-xl font-black uppercase tracking-widest italic">{todayStatus}</p>
                    <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{format(new Date(), 'hh:mm a')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => markAttendance('Present')}
                      disabled={marking}
                      className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center italic"
                    >
                      <CheckCircle2 className="mr-2" size={16} /> Mark Present
                    </button>
                    <button
                      onClick={() => markAttendance('Absent')}
                      disabled={marking}
                      className="w-full py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center italic"
                    >
                      <XCircle className="mr-2" size={16} /> Mark Absent
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Monthly Metric</p>
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 tabular-nums italic">94%</div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Presence Ratio</p>
            </div>
          </div>
        )}

        <div className={isPrincipal ? 'lg:col-span-4' : 'lg:col-span-3'}>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">System Records</h2>
              {canViewOthers && (
                <div className="flex space-x-3">
                  <button onClick={exportToCSV} className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                    <Download size={14} className="mr-2" /> Export
                  </button>
                  {isPrincipal && (
                    <button onClick={dispatchEmail} className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                      <Mail size={14} className="mr-2" /> 5 PM Auto-Dispatch
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-sm font-black italic text-slate-400 animate-pulse">Scanning biometric logs...</div>
              ) : attendanceList.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Date</th>
                      {canViewOthers && <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Identity</th>}
                      {canViewOthers && <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Dept.</th>}
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {attendanceList.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all">
                        <td className="p-4 font-bold text-slate-900 dark:text-white text-xs tabular-nums uppercase">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </td>
                        {canViewOthers && (
                          <td className="p-4">
                            <p className="font-black italic text-slate-950 dark:text-white text-xs tracking-tight">{record.profiles?.name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter italic">{record.profiles?.role}</p>
                          </td>
                        )}
                        {canViewOthers && (
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {record.profiles?.department}
                            </span>
                          </td>
                        )}
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-lg font-black italic text-[10px] uppercase tracking-tighter ${record.status === 'Present'
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                            : 'text-red-500 bg-red-50 dark:bg-red-950/20'
                            }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center text-slate-300 italic">
                  <BarChart3 size={40} className="mx-auto mb-4 opacity-50" strokeWidth={1} />
                  <p className="font-bold text-sm">No activity logs recorded on server.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Attendance
