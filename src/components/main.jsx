import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScannerHeart } from './ScannerHeart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { socket } from '../services/socket';

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

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        // Juft topilganda chat sahifasiga o'tkazish va partner ma'lumotini saqlash
        socket.on('matched', (data) => {
            setIsSearching(false);
            // Partner ma'lumotini sessionStorage ga saqlab chatga o'tamiz
            sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
            navigate('/chat');
        });

        socket.on('waiting', () => {
            setIsSearching(true);
        });

        return () => {
            socket.off('matched');
            socket.off('waiting');
        };
    }, [navigate]);

    const handleSearch = () => {
        if (!currentUser) return;
        setIsSearching(true);
        // Serverga find_match yuboramiz
        socket.emit('find_match', { tg_id: currentUser.telegram_id || currentUser.tg_id });
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
            <ScannerHeart />

            <div className="text-center" style={{ maxWidth: 240 }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>
                    {isSearching ? 'Faol foydalanuvchi qidirilmoqda...' : `Salom, ${currentUser?.name || 'Foydalanuvchi'}! Qidirishni boshlang`}
                </p>
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