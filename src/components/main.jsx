import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { ScannerHeart } from './ScannerHeart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { socket, connectSocket } from '../services/socket';
import { savePartnerToLocalStorage, getBlacklist } from '../utils/blacklist';

const searchButtonStyle = {
    background: 'rgba(124,90,240,0.12)',
    border: '1px solid rgba(124,90,240,0.25)',
    color: '#a78bfa',
    cursor: 'pointer',
};

export function Main() {
    const currentUser = useCurrentUser();
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);
    const [onlineCount, setOnlineCount] = useState(null);

    useEffect(() => {
        if (!socket.connected && currentUser) {
            const userTgId = currentUser.tg_id;
            connectSocket(userTgId);
        }

        const onMatched = (data) => {
            setIsSearching(false);
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
            socket.off('matched', onMatched);
            socket.off('waiting', onWaiting);
            socket.off('online_count', onOnlineCount);
        };
    }, [navigate, currentUser]);

    const handleSearch = () => {
        if (!currentUser) return;
        setIsSearching(true);

        const userTgId = currentUser.tg_id;
        const blacklist = getBlacklist();
        socket.emit('find_match', { tg_id: userTgId, blacklist });
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
            <ScannerHeart />

            <div className="text-center" style={{ maxWidth: 260 }}>
                {onlineCount !== null && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-3" style={{ background: 'rgba(124,90,240,0.12)', border: '1px solid rgba(124,90,240,0.2)', color: '#a78bfa' }}>
                        <Users size={13} />
                        <span className="font-medium">{onlineCount}</span>
                        <span style={{ color: 'rgba(167,139,250,0.6)' }}>online</span>
                    </div>
                )}
                {isSearching && (
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>
                        Faol foydalanuvchi qidirilmoqda...
                    </p>
                )}
            </div>

            <button
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-medium transition-all"
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                    ...searchButtonStyle,
                    opacity: isSearching ? 0.7 : 1,
                }}
            >
                <span
                    className="rounded-full"
                    style={{
                        width: 6,
                        height: 6,
                        background: '#a78bfa',
                        boxShadow: '0 0 6px #a78bfa',
                        display: 'inline-block',
                        animation: 'heartbeat 2s ease-in-out infinite',
                    }}
                />
                {isSearching ? 'Qidirilmoqda...' : 'Qidirish'}
            </button>
        </main>
    );
}

export default Main;
