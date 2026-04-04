import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import { Calendar, Clock, Users, ArrowRight, Zap, ShieldAlert, CheckCircle, ChevronDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL',
  'AI&DS', 'ALML', 'CSBS', 'BME', 'AERO', 'AUTO',
  'CHEM', 'BIOTECH', 'B.Arch', 'Pharm', 'MBA', 'MCA', 'Others'
]
const TIME_SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'
]

const ScheduleMeeting = () => {
  const { profile, user: authUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    departments: profile?.role === 'Principal' ? [] : [profile?.department || 'CSE'],
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    endTime: '11:00',
    duration: 60
  })

  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (formData.departments.length > 0 && formData.date && formData.time) {
      handleCheckAvailability()
    }
  }, [formData.departments.length, formData.departments, formData.date, formData.time, formData.duration])

  const handleCheckAvailability = async () => {
    setChecking(true)
    try {
      const selectedDate = new Date(formData.date)
      const dayName = format(selectedDate, 'EEEE')

      if (dayName === 'Sunday') {
        setAvailability({ free: 0, total: 0, isSunday: true })
        return
      }

      const { data: teachers, error: tError } = await supabase
        .from('profiles')
        .select('*')
        .in('department', formData.departments)

      if (tError) throw tError

      if (!teachers || teachers.length === 0) {
        setAvailability({ free: 0, total: 0, noTeachers: true })
        return
      }

      const { data: sheets, error: sError } = await supabase
        .from('timetables')
        .select('id, data')
        .in('id', teachers.map(t => t.id))

      if (sError) throw sError

      let freeCount = 0
      let freeStaffDetails = []

      // Parse meeting times in minutes from midnight
      const [mHours, mMins] = formData.time.split(':').map(Number)
      const meetingStart = mHours * 60 + mMins
      const meetingEnd = meetingStart + parseInt(formData.duration)

      sheets?.forEach(sheet => {
        const daySlots = sheet.data?.[dayName] || {}
        let isFree = true

        for (const [slotStr, status] of Object.entries(daySlots)) {
          // parse timetable slot "HH:MM - HH:MM"
          const match = slotStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
          if (match) {
            const slotStart = parseInt(match[1]) * 60 + parseInt(match[2])
            const slotEnd = parseInt(match[3]) * 60 + parseInt(match[4])

            // Checks overlap: start1 < end2 AND start2 < end1
            const overlaps = (meetingStart < slotEnd) && (slotStart < meetingEnd)

            if (overlaps) {
              // If there is an overlap, the status must be empty to be free
              if (status !== '' && status != null) {
                isFree = false
                break
              }
            }
          }
        }

        if (isFree) {
          freeCount++
          const teacher = teachers.find(t => t.id === sheet.id)
          if (teacher) freeStaffDetails.push(teacher)
        }
      })

      setAvailability({
        free: freeCount,
        total: teachers.length,
        day: dayName,
        freeStaffDetails
      })
    } catch (err) {
      console.error('Availability check failed:', err.message)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: existing, error: eError } = await supabase
        .from('meetings')
        .select('id')
        .eq('date', formData.date)
        .eq('time', `${formData.time}:00`)
        .in('department', formData.departments)

      if (eError) throw eError
      if (existing && existing.length > 0) {
        throw new Error('Conflicting meeting discovered on system for requested time.')
      }

      const meetingPayloads = formData.departments.map(dept => ({
        title: formData.title,
        agenda: formData.agenda,
        department: dept,
        date: formData.date,
        time: `${formData.time}:00`,
        duration: parseInt(formData.duration),
        created_by: authUser.id
      }))

      const { error } = await supabase
        .from('meetings')
        .insert(meetingPayloads)

      if (error) throw error

      setMessage({ type: 'success', text: 'Meeting confirmed successfully!' })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role === 'Teacher') {
    return (
      <div className="max-w-6xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Access Restricted</h2>
        <p className="text-sm font-bold text-slate-500 italic">Only Principals and HODs can schedule new meetings.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 italic">Meeting Scheduler</h1>
        <p className="text-sm text-slate-500 font-medium italic">Smart availability engine calculates the best slot for your department.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Meeting Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Departmental Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 outline-none transition-all text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Target Departments</label>
                {profile?.role === 'Principal' ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {DEPARTMENTS.map(d => (
                      <label key={d} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(d)}
                          onChange={(e) => {
                            const newDepts = e.target.checked
                              ? [...formData.departments, d]
                              : formData.departments.filter(dept => dept !== d);
                            setFormData({ ...formData, departments: newDepts })
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{d}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    {formData.departments[0] || profile?.department}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Scheduled Date</label>
                <input
                  type="date"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => {
                      const val = e.target.value;
                      const [h, m] = val.split(':').map(Number);
                      const newEndMins = (h * 60 + m) + parseInt(formData.duration);
                      const eh = String(Math.floor(newEndMins / 60)).padStart(2, '0');
                      const em = String(newEndMins % 60).padStart(2, '0');
                      setFormData({ ...formData, time: val, endTime: `${eh}:${em}` });
                    }}
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      const [eh, em] = val.split(':').map(Number);
                      const [sh, sm] = formData.time.split(':').map(Number);
                      let dur = (eh * 60 + em) - (sh * 60 + sm);
                      if (dur < 0) dur = 0;
                      setFormData({ ...formData, endTime: val, duration: dur });
                    }}
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => {
                      const dur = parseInt(e.target.value);
                      const [h, m] = formData.time.split(':').map(Number);
                      const newEndMins = (h * 60 + m) + dur;
                      const eh = String(Math.floor(newEndMins / 60)).padStart(2, '0');
                      const em = String(newEndMins % 60).padStart(2, '0');
                      setFormData({ ...formData, duration: dur, endTime: `${eh}:${em}` });
                    }}
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white"
                  >
                    {[30, 60, 90, 120, 150, 180].includes(formData.duration) ? null : <option value={formData.duration}>{formData.duration} Mins (Custom)</option>}
                    <option value={30}>30 Min</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours</option>
                    <option value={150}>2.5 Hours</option>
                    <option value={180}>3 Hours</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Agenda & Note</label>
                <textarea
                  rows="3"
                  placeholder="Outline meeting goals..."
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 outline-none transition-all text-slate-900 dark:text-white font-medium italic"
                />
              </div>
            </div>

            <AnimatePresence>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl flex items-center shadow-sm font-bold text-xs uppercase tracking-widest italic ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-red-50 dark:bg-red-950/20 text-red-600'
                    }`}
                >
                  {message.type === 'success' ? <CheckCircle size={18} className="mr-3" /> : <ShieldAlert size={18} className="mr-3" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || (availability && availability.free === 0)}
              className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 italic"
            >
              🚀 Finalize Schedule
            </button>
          </form>
        </div>

        {/* Engine Result Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-emerald-600 p-8 rounded-xl text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8 opacity-80 italic">AI Analysis</h3>
              {checking ? (
                <div className="py-8 text-center animate-pulse">
                  <p className="text-xl font-black italic">Syncing Staff Records...</p>
                </div>
              ) : availability ? (
                <div className="space-y-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl font-black italic tracking-tighter tabular-nums mb-1">
                      {availability.isSunday ? '00' : availability.free}/{availability.isSunday ? '00' : availability.total}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Staff Available</p>
                  </div>

                  {availability.isSunday ? (
                    <p className="text-[10px] font-black bg-white/20 p-2 rounded-lg italic">Sunday is an administrative holiday.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-emerald-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(availability.free / availability.total) * 100}%` }}
                            className="h-full bg-white shadow-[0_0_10px_white]"
                          />
                        </div>
                        <p className="text-[9px] font-black text-emerald-100 italic uppercase">
                          {availability.free === availability.total ? 'Full availability' : 'Partial availability detected'}
                        </p>
                      </div>

                      {availability.freeStaffDetails && availability.freeStaffDetails.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-emerald-500/30 text-left">
                          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-4 italic flex items-center justify-between">
                            <span>Available Personnel</span>
                            <span className="bg-emerald-900/50 px-2 py-1 rounded text-emerald-300">{availability.freeStaffDetails.length} Free</span>
                          </p>
                          <div className="space-y-3 shadow-inner p-2 bg-emerald-700/20 rounded-xl overflow-y-auto max-h-64 scrollbar-thin">
                            {availability.freeStaffDetails.map((staff, idx) => (
                              <div key={idx} className="bg-emerald-800/40 p-4 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-black text-white italic">{staff.name}</p>
                                  <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-emerald-100/70 mt-1 space-x-2">
                                    <span>{staff.role}</span>
                                    <span>•</span>
                                    <span>{staff.department}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center opacity-50 italic">
                  <Zap size={32} className="mx-auto mb-3" />
                  <p className="font-black text-xs uppercase tracking-widest">Select Parameters</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Scheduling Tip</h4>
            <p className="text-xs font-medium text-slate-500 italic">Availability is strictly derived from the departmental JSON timetables updated by each individual teacher.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleMeeting
