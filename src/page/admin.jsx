import { Fragment, useState, useEffect, useCallback } from 'react';
import { BackIcon, ChevronRight, CheckIcon } from '../assets/icon';
import { IconButton } from '../components/IconButton';
import { UserAvatar } from '../components/Avatar';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateUserPlan,
  deleteUser,
  fetchAdminReports,
  reviewReport,
  sendBroadcast,
} from '../services/api';



const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'users', label: 'Foydalanuvchilar', icon: '👥' },
  { key: 'reports', label: 'Shikoyatlar', icon: '🚩' },
  { key: 'broadcast', label: 'Xabar yuborish', icon: '📢' },
];

const backButtonStyle = {
  width: 36, height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', flexShrink: 0,
};

function StatCard({ label, value, icon, color }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 42, height: 42, background: `${color}20`, color, fontSize: 20 }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: '#f0effc' }}>{value}</div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width="20" height="20">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoaderSpinner /></div>;
  if (!stats) return <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ma'lumot yuklanmadi</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} icon="👥" color="#a78bfa" />
        <StatCard label="Online" value={stats.onlineUsers} icon="🟢" color="#6ee7b7" />
        <StatCard label="VIP" value={stats.vips} icon="⭐" color="#fcd34d" />
        <StatCard label="Bloklangan" value={stats.bannedUsers} icon="🔨" color="#f87171" />
        <StatCard label="Kutilayotgan shikoyat" value={stats.pendingReports} icon="🚩" color="#fb923c" />
        <StatCard label="Bugungi shikoyat" value={stats.todayReports} icon="📅" color="#60a5fa" />
      </div>

      {/* Gender distribution */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-semibold mb-3" style={{ color: '#f0effc' }}>Jins bo'yicha</div>
        <div className="flex gap-4">
          {stats.genderStats?.map(g => (
            <div key={g._id} className="flex items-center gap-2">
              <span style={{ fontSize: 20 }}>{g._id === 'Erkak' ? '👨' : '👩'}</span>
              <span className="text-sm font-medium" style={{ color: '#f0effc' }}>{g._id}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top regions */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-semibold mb-3" style={{ color: '#f0effc' }}>Eng ko'p foydalanuvchili viloyatlar</div>
        <div className="space-y-2">
          {stats.regionStats?.map((r, i) => (
            <div key={r._id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', width: 20 }}>{i + 1}.</span>
                <span className="text-sm" style={{ color: '#f0effc' }}>{r._id}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: Math.min(100, (r.count / stats.totalUsers) * 200),
                    background: 'linear-gradient(90deg, #7c5af0, #a78bfa)',
                  }}
                />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users Management ──────────────────────────────────────────────────────

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({ search, plan: planFilter, page });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handlePlanChange = async (tgId, newPlan) => {
    setActionLoading(tgId);
    try {
      await updateUserPlan(tgId, newPlan);
      await loadUsers();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tgId, name) => {
    if (!confirm(`"${name}" (${tgId}) foydalanuvchini o'chirishni tasdiqlaysizmi?`)) return;
    setActionLoading(tgId);
    try {
      await deleteUser(tgId);
      await loadUsers();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0effc', borderRadius: 10, padding: '10px 14px', fontSize: 13, width: '100%',
    outline: 'none',
  };

  return (
    <div className="p-4">
      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <input
            style={inputStyle}
            placeholder="Ism yoki ID orqali qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          style={{ ...inputStyle, width: 'auto', minWidth: 100, cursor: 'pointer' }}
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
        >
          <option value="">Hamma plan</option>
          <option value="Free">Free</option>
          <option value="VIP">VIP</option>
          <option value="Admin">Admin</option>
          <option value="Banned">Banned</option>
        </select>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-12"><LoaderSpinner /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Foydalanuvchi topilmadi</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.tg_id}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <UserAvatar
                name={u.name}
                avatar={u.avatar}
                size={38}
                border={false}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#f0effc' }}>{u.name}</div>
                <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {u.username} · {u.region} · {u.gender} · {u.birthYear}
                </div>
              </div>

              {/* Plan badge + changer */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {['Free', 'VIP', 'Admin', 'Banned'].map(p => (
                  <button
                    key={p}
                    disabled={actionLoading === u.tg_id}
                    onClick={() => handlePlanChange(u.tg_id, p)}
                    className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                    style={{
                      background: u.plan === p ? planColors[p].bg : 'rgba(255,255,255,0.04)',
                      color: u.plan === p ? planColors[p].text : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${u.plan === p ? planColors[p].border : 'rgba(255,255,255,0.06)'}`,
                      cursor: actionLoading === u.tg_id ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === u.tg_id ? 0.5 : 1,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handleDelete(u.tg_id, u.name)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: 'rgba(248,113,113,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(248,113,113,0.2)',
                    cursor: 'pointer',
                  }}
                  title="O'chirish"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0effc',
              opacity: page <= 1 ? 0.3 : 1,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ←
          </button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0effc',
              opacity: page >= totalPages ? 0.3 : 1,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

const planColors = {
  Free: { text: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.25)' },
  VIP: { text: '#fcd34d', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
  Admin: { text: '#a78bfa', bg: 'rgba(124,90,240,0.15)', border: 'rgba(124,90,240,0.25)' },
  Banned: { text: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.25)' },
};

// ─── Reports Moderation ─────────────────────────────────────────────────────

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReports({ status: statusFilter, page });
      setReports(data.reports);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleReview = async (reportId, status) => {
    setActionLoading(reportId);
    try {
      await reviewReport(reportId, { status, adminNote });
      setSelectedReport(null);
      setAdminNote('');
      await loadReports();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const filterBtnStyle = (key) => ({
    background: statusFilter === key ? 'rgba(124,90,240,0.2)' : 'rgba(255,255,255,0.04)',
    color: statusFilter === key ? '#a78bfa' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${statusFilter === key ? 'rgba(124,90,240,0.3)' : 'rgba(255,255,255,0.06)'}`,
    cursor: 'pointer',
  });

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[
          { key: 'pending', label: 'Kutilmoqda' },
          { key: 'reviewed', label: 'Ko\'rib chiqilgan' },
          { key: 'dismissed', label: 'Rad etilgan' },
          { key: 'warned', label: 'Ogohlantirilgan' },
          { key: 'banned', label: 'Bloklangan' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={filterBtnStyle(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoaderSpinner /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Shikoyatlar yo'q</div>
      ) : (
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r._id}>
              <div
                className="rounded-2xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedReport(selectedReport?._id === r._id ? null : r)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: '#f0effc' }}>
                    {r.reporter?.name || r.reporterTgId}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                  <span className="text-xs font-medium" style={{ color: '#f87171' }}>
                    {r.reported?.name || r.reportedTgId}
                  </span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-lg"
                    style={{
                      background: statusColors[r.status]?.bg || 'rgba(255,255,255,0.05)',
                      color: statusColors[r.status]?.text || 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {statusLabels[r.status] || r.status}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {r.reason}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Expanded review panel */}
              {selectedReport?._id === r._id && (
                <div
                  className="mx-2 mb-2 rounded-2xl p-3 space-y-2"
                  style={{ background: 'rgba(124,90,240,0.06)', border: '1px solid rgba(124,90,240,0.12)' }}
                >
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Sabab: <span style={{ color: '#f0effc' }}>{r.reason}</span>
                  </div>
                  {r.chatContext && (
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Chat kontekst: <span style={{ color: '#f0effc' }}>{r.chatContext}</span>
                    </div>
                  )}
                  <input
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0effc', borderRadius: 10, padding: '8px 12px', fontSize: 12, width: '100%',
                      outline: 'none',
                    }}
                    placeholder="Admin izohi..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => handleReview(r._id, 'dismissed')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      ❌ Rad etish
                    </button>
                    <button onClick={() => handleReview(r._id, 'warned')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.15)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.25)', cursor: 'pointer' }}>
                      ⚠️ Ogohlantirish
                    </button>
                    <button onClick={() => handleReview(r._id, 'banned')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer' }}>
                      🔨 Bloklash
                    </button>
                    <button onClick={() => handleReview(r._id, 'reviewed')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer' }}>
                      ✅ Ko'rib chiqildi
                    </button>
                  </div>
                  {actionLoading === r._id && <div className="flex justify-center"><LoaderSpinner /></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0effc', opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            ←
          </button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0effc', opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            →
          </button>
        </div>
      )}
    </div>
  );
}

const statusColors = {
  pending: { text: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  reviewed: { text: '#6ee7b7', bg: 'rgba(16,185,129,0.15)' },
  dismissed: { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' },
  warned: { text: '#fcd34d', bg: 'rgba(251,191,36,0.15)' },
  banned: { text: '#f87171', bg: 'rgba(248,113,113,0.15)' },
};
const statusLabels = {
  pending: 'Kutilmoqda', reviewed: 'Ko\'rib chiqilgan', dismissed: 'Rad etilgan',
  warned: 'Ogohlantirilgan', banned: 'Bloklangan',
};

// ─── Broadcast ──────────────────────────────────────────────────────────────

function AdminBroadcast() {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState({ plan: '', gender: '', region: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const data = await sendBroadcast(message, filter);
      setResult(data);
      setMessage('');
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0effc', borderRadius: 12, padding: '12px 16px', fontSize: 14,
    outline: 'none', width: '100%', resize: 'none',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer', padding: '10px 14px', fontSize: 13 };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Xabar matni</div>
        <textarea
          style={{ ...inputStyle, minHeight: 120 }}
          placeholder="Barcha foydalanuvchilarga yuboriladigan xabarni kiriting..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={1000}
        />
        <div className="text-xs mt-1 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {message.length}/1000
        </div>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Filter (ixtiyoriy)</div>
        <div className="grid grid-cols-3 gap-2">
          <select style={selectStyle} value={filter.plan} onChange={e => setFilter(f => ({ ...f, plan: e.target.value }))}>
            <option value="">Barcha plan</option>
            <option value="Free">Free</option>
            <option value="VIP">VIP</option>
            <option value="Admin">Admin</option>
          </select>
          <select style={selectStyle} value={filter.gender} onChange={e => setFilter(f => ({ ...f, gender: e.target.value }))}>
            <option value="">Barcha jins</option>
            <option value="Erkak">Erkak</option>
            <option value="Ayol">Ayol</option>
          </select>
          <select style={selectStyle} value={filter.region} onChange={e => setFilter(f => ({ ...f, region: e.target.value }))}>
            <option value="">Barcha viloyat</option>
            {["Toshkent sh.", "Toshkent vil.", "Samarqand", "Buxoro", "Farg'ona", "Andijon", "Namangan", "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Xorazm", "Qoraqalpog'iston"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #7c5af0, #6d4bd6)',
          border: 'none', color: '#fff',
          cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
          opacity: sending || !message.trim() ? 0.5 : 1,
        }}
      >
        {sending ? <><LoaderSpinner /> Yuborilmoqda...</> : '📢 Xabarni yuborish'}
      </button>

      {result && (
        <div
          className="rounded-2xl p-4 text-sm animate-bounce-in"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#6ee7b7',
          }}
        >
          ✅ Xabar {result.recipientCount} ta foydalanuvchiga yuborildi!
          {result.recipients?.length > 0 && (
            <div className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {result.recipients.slice(0, 10).map(r => r.name).join(', ')}
              {result.recipients.length > 10 && ` va yana ${result.recipients.length - 10} ta...`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin emas → bosh sahifaga
  useEffect(() => {
    if (user && user.plan !== 'Admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.plan !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Siz admin emassiz</p>
      </div>
    );
  }

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: '#0a0a12' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <IconButton onClick={() => navigate('/settings')} className="rounded-xl" style={backButtonStyle} aria-label="Go back">
          <BackIcon />
        </IconButton>
        <div>
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>Admin Panel</span>
          <div className="text-xs" style={{ color: 'rgba(124,90,240,0.6)' }}>#{activeTab}</div>
        </div>
      </header>

      {/* Tab navigation */}
      <div
        className="flex px-2 py-2 gap-1 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.key ? 'rgba(124,90,240,0.15)' : 'transparent',
              color: activeTab === tab.key ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'broadcast' && <AdminBroadcast />}
      </div>
    </div>
  );
}

export default AdminPage;
