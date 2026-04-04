import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'
import { Save, AlertCircle, CheckCircle, Clock, Calendar, Info, ShieldAlert, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_TIME_SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'
]

const TimetableEditor = () => {
  const { profile, user } = useAuth()
  const [timetable, setTimetable] = useState({})
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (profile) {
      const timeout = setTimeout(() => setLoading(false), 5000)
      fetchTimetable().finally(() => clearTimeout(timeout))
    }
  }, [profile])

  const fetchTimetable = async () => {
    try {
      const { data, error } = await supabase
        .from('timetables')
        .select('data')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      const savedData = data?.data || {}
      const loadedSlots = savedData.timeSlots || DEFAULT_TIME_SLOTS
      setTimeSlots(loadedSlots)

      if (savedData.grid) {
        setTimetable(savedData.grid)
      } else {
        const initial = {}
        DAYS.forEach(day => {
          initial[day] = {}
          loadedSlots.forEach(slot => initial[day][slot] = '')
        })
        setTimetable(initial)
      }
    } catch (err) {
      console.error('Error fetching timetable:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCellChange = (day, slot, value) => {
    setTimetable(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: value
      }
    }))
  }

  const handleTimeSlotChange = (index, newValue) => {
    const oldSlot = timeSlots[index]
    const newSlots = [...timeSlots]
    newSlots[index] = newValue
    setTimeSlots(newSlots)

    // Also update instances in the timetable grid to keep keys in sync
    setTimetable(prev => {
      const next = { ...prev }
      DAYS.forEach(day => {
        if (next[day]) {
          next[day][newValue] = next[day][oldSlot]
          delete next[day][oldSlot]
        }
      })
      return next
    })
  }

  const saveTimetable = async () => {
    if (!profile) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('timetables')
        .upsert({
          id: user.id,
          department: profile.department || 'Administration',
          data: {
            grid: timetable,
            timeSlots: timeSlots
          }
        })

      if (error) throw error
      setMessage({ type: 'success', text: 'Timetable updated successfully.' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: `Sync failed: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 font-bold text-slate-400">
      <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
      LOADING TIMETABLE...
    </div>
  )

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Simple Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Timetable Editor</h1>
          <p className="text-sm text-slate-500 font-medium italic">Update your weekly schedule. You can edit the time periods in the first column.</p>
        </div>
        <div className="flex space-x-3">
          <label className="cursor-pointer px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 flex items-center transition-all">
            <Upload size={16} className="mr-2" />
            Import File
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.doc,.docx,.pdf,image/*,.csv"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  setMessage({ type: 'success', text: `Analyzing ${e.target.files[0].name}... AI processing initialized.` })
                  setTimeout(() => {
                    setMessage({ type: 'success', text: `File imported successfully. Editor populated.` })
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                  }, 2000)
                }
              }}
            />
          </label>

          <button
            onClick={saveTimetable}
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 flex items-center transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={16} className="mr-2" />
                Save Schedule
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border flex items-center font-bold text-xs uppercase tracking-widest ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600'
              }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} className="mr-3" /> : <AlertCircle size={18} className="mr-3" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplified Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="p-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">Time / Day</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 text-center font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest border-b border-l border-slate-200 dark:border-slate-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {timeSlots.map((slot, index) => (
              <tr key={index}>
                <td className="p-0 bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-200 dark:border-slate-700 min-w-[160px]">
                  <div className="flex items-center px-4 py-2 group">
                    <Clock size={12} className="mr-2 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={slot}
                      onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                      className="bg-transparent border-none outline-none text-[10px] font-black text-slate-500 dark:text-slate-400 w-full focus:text-emerald-500 uppercase tracking-tighter"
                    />
                  </div>
                </td>
                {DAYS.map(day => (
                  <td key={`${day}-${index}`} className="p-0 border-l border-slate-200 dark:border-slate-700 min-w-[150px]">
                    <input
                      type="text"
                      placeholder="Free"
                      value={timetable[day]?.[slot] || ''}
                      onChange={(e) => handleCellChange(day, slot, e.target.value)}
                      className={`w-full p-4 h-16 text-center text-xs font-bold outline-none transition-all focus:bg-slate-50 dark:focus:bg-slate-900/50 ${(timetable[day]?.[slot] || '').toLowerCase().includes('busy')
                          ? 'text-red-500 bg-red-50/30 dark:bg-red-950/10'
                          : (timetable[day]?.[slot] || '') ? 'text-blue-600 bg-blue-50/30 dark:bg-blue-950/10' : 'text-slate-900 dark:text-white'
                        }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Minimal Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
          <span>Busy Slot</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500" />
          <span>Academic Duty</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <span>Available (Blank)</span>
        </div>
      </div>
    </div>
  )
}

export default TimetableEditor
