import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase/client'
import { format } from 'date-fns'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingProfile = useRef(false)

  useEffect(() => {
    // Safety timeout to prevent infinite loading screen
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session check error:', error.message)
        clearTimeout(safetyTimeout)
        setLoading(false)
        return
      }
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => {
          clearTimeout(safetyTimeout)
        })
      } else {
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Catching auth session error:', err)
      clearTimeout(safetyTimeout)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const enforcePersonalAttendance = async (userProfile) => {
    if (!userProfile) return
    const now = new Date()
    if (now.getHours() < 11) return

    try {
      const today = format(now, 'yyyy-MM-dd')
      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', userProfile.id)
        .eq('date', today)
        .maybeSingle()

      if (!data || data.status === 'Absent') {
        await supabase.from('attendance').upsert({
          user_id: userProfile.id,
          date: today,
          status: 'Late Login'
        })
        window.alert("LATE LOGIN DETECTED: It is past 11:00 AM. Your attendance has been immediately marked as 'Late Login'. Please communicate to the Principal and HOD to double-present your validity.")
      }
    } catch (err) {
      console.error('Error enforcing personal attendance:', err)
    }
  }

  const fetchProfile = async (userId) => {
    if (fetchingProfile.current) return
    fetchingProfile.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to avoid error if not found

      if (error) {
        console.error('Error fetching profile:', error.message)
      } else {
        setProfile(data)
        enforcePersonalAttendance(data)
      }
    } catch (error) {
      console.error('Fetch profile crash:', error.message)
    } finally {
      fetchingProfile.current = false
      setLoading(false)
    }
  }

  const signUp = async (email, password, name, role, department) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, department }
      }
    })

    if (error) return { error }

    // Manually create profile if trigger is not set up
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: data.user.id, name, role, department }
      ])

    if (profileError) console.error('Profile creation error:', profileError.message)
    return { data, error: null }
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })

  const loginAsGuest = (role = 'Principal') => {
    const mockUser = { id: 'guest-id', email: 'guest@meetsync.edu' }
    const mockProfile = {
      id: 'guest-id',
      name: 'Guest Administrator',
      role: role,
      department: role === 'Principal' ? null : 'Computer Science'
    }
    setUser(mockUser)
    setProfile(mockProfile)
    setLoading(false)
  }

  const signOut = () => {
    setUser(null)
    setProfile(null)
    supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    loginAsGuest
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
