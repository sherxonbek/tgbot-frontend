import { useNavigate } from "react-router-dom";
import { SettingsIcon } from "../assets/icon"
import Main from "../components/main"
import { Navbar } from "../components/navbar"


// ── home page ────────────────────────────────────────────────────────────────
export default function HomePage() {

    const navigate = useNavigate();

    return (
        <div
            className="fade-in-up relative flex flex-col"
            style={{ minHeight: '100dvh', minWidth: 0 }}
        >
            <Navbar />

            {/* center content */}
            <Main />

            {/* settings fab */}
            <div
                className="absolute"
                style={{ bottom: 28, right: 24 }}
            >
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center justify-center rounded-2xl transition-all"
                    style={{
                        width: 50,
                        height: 50,
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.65)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(124,90,240,0.22)'
                        e.currentTarget.style.borderColor = 'rgba(124,90,240,0.4)'
                        e.currentTarget.style.color = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                    }}
                    aria-label="Open settings"
                >
                    <SettingsIcon />
                </button>
            </div>
        </div>
    )
}