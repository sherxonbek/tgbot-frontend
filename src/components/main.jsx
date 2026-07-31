import { useNavigate } from 'react-router-dom';
import { Users, X, RotateCcw } from 'lucide-react';
import { ScannerHeart } from './ScannerHeart';
import { SearchTimer } from './SearchTimer';
import { useUser } from '../context/UserContext';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { savePartnerToLocalStorage } from '../utils/blacklist';

export function Main() {
    // 15-FIX: deprecated useCurrentUser o'rniga useUser()
    const { user: currentUser } = useUser();
    const navigate = useNavigate();

    // 🔴 4-FIX: qidiruv logikasi useMatchmaking hook'iga chiqarildi
    // (ilgari ChatPage.jsx bilan dublikat edi — timer, clock, socket listenerlar bir xil)
    const {
        isSearching,
        searchTimedOut,
        onlineCount,
        searchSeconds,
        startSearch,
        cancelSearch,
        SEARCH_TIMEOUT_MS,
    } = useMatchmaking({
        tgId: currentUser?.tg_id,
        onMatched: (data) => {
            const partnerId = data.partner?.tg_id;
            savePartnerToLocalStorage(partnerId);
            sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
            navigate('/chat');
        },
    });

    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
            <ScannerHeart />

            <div className="text-center" style={{ maxWidth: 260 }}>
                {onlineCount !== null && (
                    <div
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs glass card-glow"
                        style={{
                            background: 'rgba(124,90,240,0.12)',
                            border: '1px solid rgba(124,90,240,0.22)',
                            color: '#a78bfa',
                            boxShadow: '0 0 18px rgba(124,90,240,0.12)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <Users size={13} />
                        <span className="font-bold">{onlineCount}</span>
                        <span style={{ color: 'rgba(167,139,250,0.6)' }}>online</span>
                        <span
                            className="rounded-full"
                            style={{ width: 6, height: 6, background: '#6ee7b7', boxShadow: '0 0 6px #6ee7b7', display: 'inline-block' }}
                        />
                    </div>
                )}

                {isSearching && (
                    <SearchTimer elapsed={searchSeconds} total={SEARCH_TIMEOUT_MS / 1000} />
                )}

                {searchTimedOut && (
                    <div className="animate-bounce-in">
                        <p className="text-sm font-medium" style={{ color: '#fcd34d', lineHeight: '1.6' }}>
                            Qidiruv vaqti tugadi
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            Hozircha bo'sh foydalanuvchi topilmadi. Keyinroq qayta urinib ko'ring.
                        </p>
                    </div>
                )}
            </div>

            {isSearching ? (
                <button
                    className="btn-soft flex items-center gap-2 px-8 py-3 rounded-full text-xs font-semibold"
                    onClick={cancelSearch}
                    style={{ cursor: 'pointer' }}
                >
                    <X size={15} />
                    Bekor qilish
                </button>
            ) : (
                <button
                    className="btn-glow flex items-center gap-2 px-10 py-3.5 rounded-full text-xs font-semibold tracking-wide uppercase"
                    onClick={startSearch}
                    style={{ cursor: 'pointer' }}
                >
                    <span
                        className="rounded-full"
                        style={{
                            width: 7,
                            height: 7,
                            background: searchTimedOut ? '#fcd34d' : '#a78bfa',
                            boxShadow: searchTimedOut ? '0 0 8px #fcd34d' : '0 0 8px #a78bfa',
                            display: 'inline-block',
                            animation: 'heartbeat 2s ease-in-out infinite',
                        }}
                    />
                    {searchTimedOut ? (
                        <><RotateCcw size={13} /> Qayta urinish</>
                    ) : (
                        'Qidirish'
                    )}
                </button>
            )}
        </main>
    );
}

export default Main;
