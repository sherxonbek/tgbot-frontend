import { useState, useEffect, useRef } from 'react'
import { FlagIcon, SendIcon, SkipIcon } from '../assets/icon'
import { USERS } from '../config/bd' // Bazani import qilamiz
import { Navbar } from '../components/navbar'
import { useNavigate } from 'react-router-dom'

// ── HOZIRCHA 1-USER BILAN KIRISH (Keyinchalik tg_id orqali dinamik olinadi) ─────────────────
const CURRENT_USER = USERS[0]; // Alex Ivanov (bizning profilimiz)
const MATCH_USER = USERS[1];   // Maria Petrova (suhbatdoshimiz)

// ── chat page ─────────────────────────────────────────────────────────────────
export function ChatPage({ onNext }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [reportOpen, setReportOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const bottomRef = useRef(null)

    const navigate = useNavigate();

    const now = () => {
        const d = new Date()
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const sendMessage = () => {
        const text = input.trim()
        if (!text) return
        setSending(true)
        // Xabar yuborayotgan shaxs: CURRENT_USER.tg_id orqali aniqlanishi mumkin
        setMessages((prev) => [...prev, { id: Date.now(), text, from: 'me', senderTgId: CURRENT_USER.tg_id, time: now() }])
        setInput('')
        setTimeout(() => setSending(false), 300)
        
        // mock reply after delay (suhbatdosh tomonidan javob)
        setTimeout(() => {
            const replies = ['Hey! 👋', 'That\'s interesting!', 'Tell me more 😊', 'Nice to meet you!', 'Really? How so?']
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, text: replies[Math.floor(Math.random() * replies.length)], from: 'them', senderTgId: MATCH_USER.tg_id, time: now() },
            ])
        }, 1200)
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="slide-in-right flex flex-col" style={{ height: '100dvh' }}>
            <Navbar />

            {/* next / report bar */}
            <div
                className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: 'rgba(124,90,240,0.18)', border: '1px solid rgba(124,90,240,0.35)', color: '#a78bfa', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.18)' }}
                >
                    <SkipIcon />
                    Next
                </button>
                <div className="relative">
                    <button
                        onClick={() => setReportOpen((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                    >
                        <FlagIcon />
                        Report
                    </button>
                    {reportOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
                            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 170 }}
                        >
                            {['Spam', 'Zo`rovonlik', 'behayo kontent', 'Soxta profil'].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => { setReportOpen(false); onNext ? onNext() : navigate('/') }}
                                    className="w-full text-left text-xs px-4 py-3 transition-colors block"
                                    style={{ color: '#f0effc', background: 'none', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ scrollbarWidth: 'none' }}
                onClick={() => setReportOpen(false)}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3">
                        <div
                            className="flex items-center justify-center rounded-full"
                            style={{ width: 56, height: 56, background: 'rgba(124,90,240,0.12)', border: '1px solid rgba(124,90,240,0.2)' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.6" width="26" height="26">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Suhbatni boshlang. ({MATCH_USER.name} bilan)
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {messages.map((msg, i) => {
                            const isMe = msg.from === 'me'
                            const prevSame = i > 0 && messages[i - 1].from === msg.from
                            return (
                                <div
                                    key={msg.id}
                                    className="flex items-end gap-2"
                                    style={{
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginTop: prevSame ? 2 : 10,
                                        animationName: 'fade-in-up',
                                        animationDuration: '0.25s',
                                        animationFillMode: 'both',
                                    }}
                                >
                                    
                                    {!isMe && prevSame && <div style={{ width: 26, flexShrink: 0 }} />}
                                    <div style={{ maxWidth: '72%' }}>
                                        <div
                                            className="text-sm px-3.5 py-2.5 rounded-2xl"
                                            style={{
                                                background: isMe
                                                    ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)'
                                                    : 'rgba(255,255,255,0.07)',
                                                color: isMe ? '#fff' : '#f0effc',
                                                borderRadius: isMe
                                                    ? '18px 18px 4px 18px'
                                                    : '18px 18px 18px 4px',
                                                boxShadow: isMe ? '0 2px 12px rgba(124,90,240,0.35)' : 'none',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.45',
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                        <div
                                            className="text-xs mt-0.5"
                                            style={{ color: 'rgba(255,255,255,0.22)', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}
                                        >
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* input bar */}
            <div
                className="flex-shrink-0 px-3 py-3 flex items-end gap-2 mb-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(16px)', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
            >
                <div
                    className="flex-1 flex items-end rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minHeight: 44, maxHeight: 120 }}
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Write a message…"
                        rows={1}
                        className="flex-1 bg-transparent text-sm px-4 py-3 resize-none outline-none"
                        style={{
                            color: '#f0effc',
                            caretColor: '#a78bfa',
                            lineHeight: '1.45',
                            scrollbarWidth: 'none',
                            minHeight: 44,
                        }}
                    />
                </div>

                <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all"
                    style={{
                        width: 46,
                        height: 46,
                        background: input.trim()
                            ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)'
                            : 'rgba(255,255,255,0.06)',
                        border: input.trim() ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        color: input.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                        cursor: input.trim() ? 'pointer' : 'default',
                        boxShadow: input.trim() ? '0 4px 20px rgba(124,90,240,0.5)' : 'none',
                        transform: sending ? 'scale(0.92)' : 'scale(1)',
                        flexShrink: 0,
                    }}
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
            </div>
        </div>
    )
}