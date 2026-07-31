import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, RotateCcw } from 'lucide-react';
import { ScannerHeart } from './ScannerHeart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { socket, connectSocket } from '../services/socket';
import { savePartnerToLocalStorage, getBlacklist } from '../utils/blacklist';

const SEARCH_TIMEOUT_MS = 60000; // 60 soniya — shuncha vaqt ichida juft topilmasa avtomatik to'xtaydi

export function Main() {
    const currentUser = useCurrentUser();
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimedOut, setSearchTimedOut] = useState(false);
    const [onlineCount, setOnlineCount] = useState(null);
    const timerRef = useRef(null);

    const clearTimer = () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    // Qidiruvni to'xtatish (server queue dan olib tashlaydi)
    const cancelSearch = () => {
        clearTimer();
        setIsSearching(false);
        setSearchTimedOut(false);
        socket.emit('cancel_match');
    };

    // Sahifa yopilganda ham server queue dan olib tashlaymiz
    useEffect(() => {
        return () => {
            clearTimer();
            if (socket.connected) socket.emit('cancel_match');
        };
    }, []);

    useEffect(() => {
        if (!socket.connected && currentUser) {
            const userTgId = currentUser.tg_id;
            connectSocket(userTgId);
        }

        const onMatched = (data) => {
            clearTimer();
            setIsSearching(false);
            setSearchTimedOut(false);
            const partnerId = data.partner?.tg_id;
            savePartnerToLocalStorage(partnerId);
            sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
            navigate('/chat');
        };

        const onWaiting = () => {
            setIsSearching(true);
        };

        const onOnlineCount = ({ count }) => {
            setOnlineCount(count);
        };

        // Get initial online count
        if (socket.connected) {
            socket.emit('get_online_count');
        }

        socket.on('matched', onMatched);
        socket.on('waiting', onWaiting);
        socket.on('online_count', onOnlineCount);

        return () => {
            clearTimer();
            socket.off('matched', onMatched);
            socket.off('waiting', onWaiting);
            socket.off('online_count', onOnlineCount);
        };
    }, [navigate, currentUser]);

    const handleSearch = () => {
        if (!currentUser) return;
        clearTimer();
        setIsSearching(true);
        setSearchTimedOut(false);

        const userTgId = currentUser.tg_id;
        const blacklist = getBlacklist();
        socket.emit('find_match', { tg_id: userTgId, blacklist });

        // Timeout — 60 soniyada juft topilmasa qidiruvni to'xtatamiz
        timerRef.current = setTimeout(() => {
            setSearchTimedOut(true);
            setIsSearching(false);
            socket.emit('cancel_match');
        }, SEARCH_TIMEOUT_MS);
    };

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
                    <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>
                        Faol foydalanuvchi qidirilmoqda...
                    </p>
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
                    onClick={handleSearch}
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
