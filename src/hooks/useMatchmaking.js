import { useEffect, useRef, useState, useCallback } from 'react';
import { socket, connectSocket } from '../services/socket';
import { getBlacklist } from '../utils/blacklist';
import { sfx } from '../utils/sfx';

const SEARCH_TIMEOUT_MS = 60000; // 60 soniya — juft topilmasa avtomatik to'xtaydi

/**
 * useMatchmaking — juftlashish (search) logikasini birlashtiruvchi hook.
 *
 * 🔴 4-FIX: Bu logika ilgari `Main.jsx` va `ChatPage.jsx` da DUBLIKAT qilingan edi
 * (isSearching / searchTimedOut / onlineCount / searchSeconds + timer/clock + matched/
 * waiting/online_count socket listenerlar). Endi bitta hook — ikkala sahifa ishlatadi.
 *
 * @param {string}  tgId       — qidiruv boshlovchi user (currentUser.tg_id)
 * @param {Function} onMatched — juft topilganda chaqiriladi (har bir sahifa o'z logikasini yozadi)
 */
export function useMatchmaking({ tgId, onMatched }) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [onlineCount, setOnlineCount] = useState(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const timerRef = useRef(null);
  const clockRef = useRef(null);
  // onMatched ni ref orqali saqlaymiz — socket effect bir marta ro'yxatdan o'tadi,
  // lekin callback doim eng so'nggi versiyada bo'ladi (stale closure yo'q).
  const onMatchedRef = useRef(onMatched);
  // onMatchedRef ni effect'da yangilaymiz — render paytida ref yozish
  // react-hooks/refs lint qoidasini buzardi; har renderdan keyin yangilanadi.
  useEffect(() => { onMatchedRef.current = onMatched; });

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const stopClock = useCallback(() => {
    if (clockRef.current) { clearInterval(clockRef.current); clockRef.current = null; }
  }, []);

  // Sekund hisoblagich (taymer) — har 1 soniyada yangilanadi
  const startClock = useCallback(() => {
    stopClock();
    setSearchSeconds(0);
    clockRef.current = setInterval(() => {
      setSearchSeconds((s) => Math.min(s + 1, SEARCH_TIMEOUT_MS / 1000));
    }, 1000);
  }, [stopClock]);

  const startSearch = useCallback(() => {
    if (!tgId) return;
    clearTimer();
    setIsSearching(true);
    setSearchTimedOut(false);
    sfx.warm(); // AudioContext ni user gesture ichida tayyorlaymiz
    startClock();
    socket.emit('find_match', { tg_id: tgId, blacklist: getBlacklist() });
    // 60 soniyada juft topilmasa — avtomatik to'xtatamiz
    timerRef.current = setTimeout(() => {
      stopClock();
      setSearchTimedOut(true);
      setIsSearching(false);
      sfx.timeout();
      socket.emit('cancel_match');
    }, SEARCH_TIMEOUT_MS);
  }, [tgId, clearTimer, startClock, stopClock]);

  const cancelSearch = useCallback(() => {
    clearTimer();
    stopClock();
    setIsSearching(false);
    setSearchTimedOut(false);
    sfx.cancel();
    socket.emit('cancel_match');
  }, [clearTimer, stopClock]);

  // Socket ulanish + matched/waiting/online_count listenerlar
  useEffect(() => {
    if (!socket.connected && tgId) {
      connectSocket(tgId);
    }

    const onMatched = (data) => {
      clearTimer();
      stopClock();
      sfx.match();
      setIsSearching(false);
      setSearchTimedOut(false);
      onMatchedRef.current?.(data);
    };

    const onWaiting = () => setIsSearching(true);
    const onOnlineCount = ({ count }) => setOnlineCount(count);

    socket.on('matched', onMatched);
    socket.on('waiting', onWaiting);
    socket.on('online_count', onOnlineCount);

    // Initial online count
    if (socket.connected) {
      socket.emit('get_online_count');
    }

    return () => {
      clearTimer();
      stopClock();
      socket.off('matched', onMatched);
      socket.off('waiting', onWaiting);
      socket.off('online_count', onOnlineCount);
      // Sahifa yopilganda ham server queue dan olib tashlaymiz
      if (socket.connected) socket.emit('cancel_match');
    };
  }, [tgId, clearTimer, stopClock]);

  return {
    isSearching,
    searchTimedOut,
    onlineCount,
    searchSeconds,
    startSearch,
    cancelSearch,
    SEARCH_TIMEOUT_MS,
  };
}
