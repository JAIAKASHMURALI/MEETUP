import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const IntroAnimation = ({ onComplete }) => {
  const [phase, setPhase] = useState('logo')   // logo → name → slogan → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('name'),   900)   // logo visible → slide name in
    const t2 = setTimeout(() => setPhase('slogan'), 1800)  // name visible → fade slogan in
    const t3 = setTimeout(() => setPhase('exit'),   3000)  // hold for a beat → start exit
    const t4 = setTimeout(() => onComplete?.(),     3700)  // exit animation done → show app
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={phase === 'exit' ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <img
              src="/logo.png"
              alt="MeetSync"
              className="w-24 h-24 object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={phase === 'name' || phase === 'slogan' || phase === 'exit'
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 18 }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-baseline gap-0 mb-3"
          >
            <span className="text-4xl font-black text-slate-900 tracking-tighter">Meet</span>
            <span className="text-4xl font-black text-emerald-500 tracking-tighter">Sync</span>
          </motion.div>

          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={phase === 'slogan' || phase === 'exit'
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 10 }
            }
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center space-x-2"
          >
            <div className="h-px w-8 bg-emerald-400 rounded-full" />
            <span className="text-sm font-semibold text-slate-500 tracking-widest uppercase italic">
              Where everyone meets!
            </span>
            <div className="h-px w-8 bg-emerald-400 rounded-full" />
          </motion.div>

          {/* Bottom progress bar */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 h-0.5 bg-emerald-200 rounded-full overflow-hidden"
            style={{ width: 120 }}
          >
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default IntroAnimation
