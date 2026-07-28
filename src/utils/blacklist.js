const STORAGE_KEY = 'recent_matched_partners';
const THREE_MINUTES_MS = 3 * 60 * 1000;

export function readActivePartnerHistory() {
  const nowTime = Date.now();

  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const activeHistory = {};

    for (const [id, expireTime] of Object.entries(history)) {
      if (expireTime > nowTime) {
        activeHistory[id] = expireTime;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeHistory));
    return activeHistory;
  } catch (error) {
    console.error('recent_matched_partners parse xatoligi:', error);
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function savePartnerToLocalStorage(partnerId) {
  if (!partnerId) return;
  const activeHistory = readActivePartnerHistory();
  activeHistory[String(partnerId)] = Date.now() + THREE_MINUTES_MS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activeHistory));
}

export function getBlacklist() {
  return Object.keys(readActivePartnerHistory());
}
