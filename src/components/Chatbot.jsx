import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, ChevronRight } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import chatbotAvatar from '../assets/chatbot-avatar.png'

// Character Image Avatar with Jumping Animation & Hand Gestures
const AnimeAvatar = ({ isThinking, isTalking, size = 60 }) => {
    return (
        <motion.div
            className="relative"
            style={{ width: size, height: size }}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: isTalking ? 0.4 : 1.0, ease: "easeOut" }}
        >
            <img
                src={chatbotAvatar}
                alt="Anime Chatbot Character"
                width={size}
                height={size}
                className={`rounded-full object-cover shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-white dark:bg-slate-800 ${isTalking ? 'border-2 border-emerald-400' : ''}`}
            />
            {/* Animated SVG Hand Gesture Overlay */}
            <motion.svg
                className="absolute z-10 drop-shadow-lg"
                style={{ right: size > 50 ? "-12px" : "-8px", top: "45%", transformOrigin: "bottom center" }}
                width={size * 0.45}
                height={size * 0.45}
                viewBox="0 0 50 50"
                animate={{
                    rotate: isTalking ? [0, 35, -20, 25, 0] : isThinking ? [-10, 10, -10] : [0, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: isTalking ? 0.5 : 2 }}
            >
                {/* Dark Sleeve matching uniform */}
                <path d="M 15 35 Q 25 30 35 35 L 35 50 L 15 50 Z" fill="#1e293b" />

                {/* Fingers / Pale Skin matching Gojo's hands */}
                <path d="M 20 15 Q 25 5 30 15 L 30 35 L 20 35 Z" fill="#fde0d2" />
                <path d="M 14 22 Q 17 15 20 22 L 20 35 L 14 35 Z" fill="#fde0d2" />
                <path d="M 36 22 Q 33 15 30 22 L 30 35 L 36 35 Z" fill="#fde0d2" />
            </motion.svg>
        </motion.div>
    )
}

const ChatBubbles = ({ msg }) => {
    const isBot = msg.sender === 'bot'
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
        >
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium shadow-md ${isBot
                ? 'bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 backdrop-blur-md rounded-tl-sm shadow-black/5 dark:shadow-black/20'
                : 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/30'
                }`}>
                {msg.text}
            </div>
        </motion.div>
    )
}

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am your AI Meeting Assistant. How can I help optimize your schedule today?", sender: 'bot' }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [isTalking, setIsTalking] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isThinking])

    const handleSend = async (customText = null) => {
        const textToSend = customText || inputValue;
        if (!textToSend.trim()) return;

        const newMsg = { id: Date.now(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            let responseText = "";

            if (apiKey) {
                // Dynamic import to keep bundle small if no key exists
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const systemContext = `
You are the official MeetSync AI Assistant. MeetSync is an advanced Academic Coordination Hub for colleges.
App Features:
1. Dashboard: Principals can broadcast their live status (Busy/Free/Present) to everyone. 
2. Timetables: Teachers and HODs can import schedules via Excel, CSV, or PDF, or edit them manually.
3. Schedule Meeting: The AI automatically scans multiple department timetables to find intersecting free slots for meetings.
4. Attendance: The app enforces a strict 11:00 AM daily cutoff. Missing staff are marked 'Absent'. Late logins get a 'Late Login' penalty requiring Principal/HOD approval.

CRITICAL RULES:
- You MUST securely restrict your knowledge exclusively to MeetSync.
- If a user asks about anything outside of this web app (e.g., general AI questions, recipes, code, history), you MUST politely refuse and guide them back to MeetSync's academic tools.
- Act as a clear, step-by-step guide for users navigating the webapp. 
- If inquired about the free timings of teachers, politely direct them to the "Schedule Meeting" tab where the system's native AI Analyzer visually charts all free teacher timings across selected departments computationally.`;

                const prompt = `${systemContext}\n\nUser Question: ${textToSend}`;

                const result = await model.generateContent(prompt);
                responseText = result.response.text();
            } else {
                // Intelligent Local Context Fallback
                const t = textToSend.toLowerCase();
                if (t.includes('schedule') || t.includes('free slot') || t.includes('meeting')) {
                    responseText = "To schedule a meeting or find free slots, navigate to the **Schedule** tab on your left menu. The AI Analyzer will automatically scan all timetables across departments to find intersecting free periods.";
                } else if (t.includes('attendance') || t.includes('absent') || t.includes('late')) {
                    responseText = "Attendance operates on a strict 11:00 AM cutoff! If you fail to login before 11:00 AM, the system's Lazy Cron engine marks you as 'Absent'. If you login after 11:00 AM, it flags you as 'Late Login' requiring manual HOD intervention.";
                } else if (t.includes('timetable') || t.includes('upload') || t.includes('import')) {
                    responseText = "You can update your schedule via the **Timetable** tab. You can manually check boxes, or use our smart mock-integration to upload Excel, CSV, PDF, or image files!";
                } else if (t.includes('explain') || t.includes('what is this') || t.includes('about')) {
                    responseText = "MeetSync is a futuristic Academic Coordination Hub! It allows Principals and HODs to intelligently schedule meetings based on real-time timetable availability without manual cross-referencing. It also automates digital attendance logs!";
                } else if (t.includes('principal') || t.includes('hod')) {
                    responseText = "The Principal has universal access to schedule multi-department meetings and broadcast their active status (e.g. Busy, Free) live to the entire dashboard! HODs can schedule within their own departments.";
                } else if (t.includes('hi') || t.includes('hello') || t.includes('hey')) {
                    responseText = "Hello there! I'm your AI Academic Assistant. Do you need help scheduling meetings, checking attendance, or editing timetables today?";
                } else {
                    responseText = `I couldn't find a direct guide for "${textToSend}". However, if you are looking for specific records, utilizing the Dashboard usually solves most organizational queries!\n\n*(Note: For dynamic neural responses, please provide VITE_GEMINI_API_KEY in the .env file!)*`;
                }
            }

            // Simulate slight latency for typing effect even on fast local routes
            setTimeout(() => {
                setIsThinking(false);
                setIsTalking(true);
                setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, sender: 'bot' }]);
                setTimeout(() => setIsTalking(false), 2500);
            }, apiKey ? 100 : 800);

        } catch (error) {
            console.error("AI Error:", error);
            setIsThinking(false);
            setIsTalking(true);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: `Neural interference detected: ${error.message || 'Unknown processing error'}. Please verify your API key is active.`, sender: 'bot' }]);
            setTimeout(() => setIsTalking(false), 2000);
        }
    }

    const smartChips = [
        { label: "Today's Meetings", prompt: "Summarize my meetings for today." },
        { label: "Find Free Slot", prompt: "Find a free slot for me tomorrow." },
        { label: "Send Reminder", prompt: "Configure a reminder for upcoming events." },
    ]

    return (
        <div className="fixed bottom-6 right-6 z-[999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(10px)" }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-96 max-w-[400px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                        style={{ height: '500px', boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)' }}
                    >
                        {/* Ambient Background Gradient Animation */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10 opacity-50 z-0 animate-pulse pointer-events-none" />

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center space-x-3">
                                <AnimeAvatar isThinking={isThinking} isTalking={isTalking} size={40} />
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-black text-sm italic tracking-widest flex items-center">
                                        AI ASSISTANT
                                        <Sparkles size={12} className="ml-2 text-emerald-400" />
                                    </h3>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest leading-none mt-1">Smart Scheduling</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin relative z-10 space-y-4">
                            {messages.map(msg => <ChatBubbles key={msg.id} msg={msg} />)}

                            {isThinking && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex justify-start mb-4"
                                >
                                    <div className="bg-white/80 dark:bg-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center space-x-1 border border-slate-200/50 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Smart Chips Area */}
                        {messages.length < 3 && !isThinking && (
                            <div className="px-4 py-2 flex overflow-x-auto scrollbar-none space-x-2 relative z-10 pb-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                                {smartChips.map((chip, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(chip.prompt)}
                                        className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full transition-all flex items-center space-x-1 shadow-sm dark:shadow-none"
                                    >
                                        <span>{chip.label}</span>
                                        <ChevronRight size={12} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/50 dark:border-slate-700/50 relative z-10">
                            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus-within:border-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl px-3 py-2 transition-all shadow-sm dark:shadow-none">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputValue.trim() || isThinking}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center transform active:scale-95"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center relative overflow-hidden group pointer-events-auto"
            >
                <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
                {/* Pulse ring */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full border border-blue-400 pointer-events-none"
                />
                <AnimeAvatar isThinking={isOpen ? isThinking : false} isTalking={isOpen ? isTalking : false} size={40} />
            </motion.button>
        </div>
    )
}

export default Chatbot
