import { useState, useEffect, useCallback, useRef } from 'react';
import { BackIcon, CheckIcon } from '../assets/icon';
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
import {
  LayoutDashboard, Users, Flag, Send, Trash2, Shield, Star,
  Search, ChevronLeft, ChevronRight as ChevronRightIcon,
  Activity, Ban, Clock, Calendar, TrendingUp, UserPlus,
} from 'lucide-react';
import { DonutChart, AreaChart, MiniBars } from '../components/adminCharts';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Foydalanuvchilar', icon: Users },
  { key: 'reports', label: 'Shikoyatlar', icon: Flag },
  { key: 'broadcast', label: 'Xabar yuborish', icon: Send },
];

function LoaderSpinner({ size = 20 }) {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Animated counter ─────────────────────────────────────────────────────── */
function CountUp({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = Number(value) || 0;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display.toLocaleString('ru-RU')}</>;
}

/* ─── StatCard (gradient tile + hover lift + counter) ─────────────────────── */
function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <div
      className="glass glass-hover card-glow rounded-2xl p-4 flex items-center gap-3 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: 44, height: 44,
          background: `linear-gradient(135deg, ${color}2e, ${color}14)`,
          border: `1px solid ${color}30`,
          color,
          boxShadow: `0 6px 20px ${color}18`,
        }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight" style={{ color: '#f0effc' }}>
          <CountUp value={value} />
        </div>
        <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

const PLAN_COLORS = {
  Free: '#6ee7b7',
  VIP: '#fcd34d',
  Admin: '#a78bfa',
  Banned: '#f87171',
};

const GENDER_COLORS = {
  Erkak: '#818cf8',
  Ayol: '#f472b6',
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-[86px] skeleton" />)}
        </div>
        <div className="rounded-2xl h-[180px] skeleton" />
        <div className="rounded-2xl h-[140px] skeleton" />
      </div>
    );
  }
  if (!stats) return <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ma'lumot yuklanmadi</div>;

  const total = stats.totalUsers || 0;
  const genderData = (stats.genderStats || []).map(g => ({
    label: g._id || 'Noma\'lum',
    value: g.count,
    color: GENDER_COLORS[g._id] || '#94a3b8',
  }));
  const planData = (stats.planStats || []).map(p => ({
    label: p._id || 'Noma\'lum',
    value: p.count,
    color: PLAN_COLORS[p._id] || '#94a3b8',
  }));
  const growth = stats.growth || [];
  const growthTotal = growth.reduce((s, g) => s + g.count, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} icon={Users} color="#a78bfa" delay={0} />
        <StatCard label="Online" value={stats.onlineUsers} icon={Activity} color="#6ee7b7" delay={60} />
        <StatCard label="VIP" value={stats.vips} icon={Star} color="#fcd34d" delay={120} />
        <StatCard label="Bloklangan" value={stats.bannedUsers} icon={Ban} color="#f87171" delay={180} />
        <StatCard label="Kutilayotgan shikoyat" value={stats.pendingReports} icon={Clock} color="#fb923c" delay={240} />
        <StatCard label="Bugungi shikoyat" value={stats.todayReports} icon={Calendar} color="#60a5fa" delay={300} />
        <StatCard label="Bugungi yangi" value={stats.newUsersToday} icon={UserPlus} color="#34d399" delay={360} />
        <StatCard label="14 kunlik o'sish" value={growthTotal} icon={TrendingUp} color="#22d3ee" delay={420} />
      </div>

      {/* Growth chart (14 days) */}
      <div className="glass card-glow rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="gradient-text text-sm font-bold">Foydalanuvchilar o'sishi</span>
          <span className="ml-auto text-[10px] chip" style={{ background: 'rgba(34,211,238,0.12)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.2)' }}>
            <TrendingUp size={10} /> 14 kun
          </span>
        </div>
        {growth.length > 0 ? (
          <>
            <AreaChart data={growth} height={130} color="#67e8f9" gradientId="growth-grad" />
            <MiniBars data={growth} color="#22d3ee" height={44} />
          </>
        ) : (
          <div className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Ma'lumot yo'q</div>
        )}
      </div>

      {/* Gender donut + Plan breakdown */}
      <div className="grid grid-cols-1 gap-4">
        <div className="glass card-glow rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="gradient-text text-sm font-bold">Jins bo'yicha taqsimot</span>
          </div>
          <DonutChart
            data={genderData.length ? genderData : [{ label: 'Ma\'lumot yo\'q', value: 0, color: '#94a3b8' }]}
            centerLabel="jami"
            centerValue={total}
          />
        </div>

        <div className="glass card-glow rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="gradient-text text-sm font-bold">Plan taqsimoti</span>
          </div>
          <DonutChart
            data={planData.length ? planData : [{ label: 'Ma\'lumot yo\'q', value: 0, color: '#94a3b8' }]}
            centerLabel="foydalanuvchi"
            size={130}
            thickness={14}
          />
        </div>
      </div>

      {/* Top regions */}
      <div className="glass card-glow rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '320ms' }}>
        <div className="text-sm font-bold mb-3" style={{ color: '#f0effc' }}>Eng ko'p foydalanuvchili viloyatlar</div>
        <div className="space-y-2.5">
          {stats.regionStats?.map((r, i) => (
            <div key={r._id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="flex items-center justify-center rounded-md text-[10px] font-bold flex-shrink-0"
                  style={{
                    width: 22, height: 22,
                    background: i < 3 ? `linear-gradient(135deg, rgba(124,90,240,0.3), rgba(124,90,240,0.1))` : 'rgba(255,255,255,0.05)',
                    border: i < 3 ? '1px solid rgba(124,90,240,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: i < 3 ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm truncate" style={{ color: '#f0effc' }}>{r._id}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (r.count / total) * 100)}%`,
                      background: 'linear-gradient(90deg, #7c5af0, #a78bfa)',
                      boxShadow: '0 0 8px rgba(124,90,240,0.4)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users Management ──────────────────────────────────────────────────────

const REGIONS_FILTER = [
  "Toshkent sh.", "Toshkent vil.", "Samarqand", "Buxoro",
  "Farg'ona", "Andijon", "Namangan", "Qashqadaryo",
  "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Xorazm", "Qoraqalpog'iston",
];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({ search, plan: planFilter, gender: genderFilter, region: regionFilter, page });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, genderFilter, regionFilter, page]);

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

  return (
    <div className="p-4">
      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            className="glass rounded-xl w-full"
            style={{ padding: '11px 14px 11px 38px', fontSize: 13, color: '#f0effc', outline: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            placeholder="Ism yoki ID orqali qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,90,240,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,90,240,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <select
          className="glass rounded-xl"
          style={{ padding: '11px 12px', fontSize: 13, color: '#f0effc', outline: 'none', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
        >
          <option value="" style={{ background: '#12121f' }}>Hamma plan</option>
          <option value="Free" style={{ background: '#12121f' }}>Free</option>
          <option value="VIP" style={{ background: '#12121f' }}>VIP</option>
          <option value="Admin" style={{ background: '#12121f' }}>Admin</option>
          <option value="Banned" style={{ background: '#12121f' }}>Banned</option>
        </select>
        <select
          className="glass rounded-xl"
          style={{ padding: '11px 12px', fontSize: 13, color: '#f0effc', outline: 'none', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
          value={genderFilter}
          onChange={e => { setGenderFilter(e.target.value); setPage(1); }}
        >
          <option value="" style={{ background: '#12121f' }}>Hamma jins</option>
          <option value="Erkak" style={{ background: '#12121f' }}>Erkak</option>
          <option value="Ayol" style={{ background: '#12121f' }}>Ayol</option>
        </select>
        <select
          className="glass rounded-xl"
          style={{ padding: '11px 12px', fontSize: 13, color: '#f0effc', outline: 'none', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
          value={regionFilter}
          onChange={e => { setRegionFilter(e.target.value); setPage(1); }}
        >
          <option value="" style={{ background: '#12121f' }}>Hamma viloyat</option>
          {REGIONS_FILTER.map(r => (
            <option key={r} value={r} style={{ background: '#12121f' }}>{r}</option>
          ))}
        </select>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-[68px] skeleton" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Foydalanuvchi topilmadi</div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <div
              key={u.tg_id}
              className="glass glass-hover card-glow rounded-2xl p-3 flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <div className="relative flex-shrink-0">
                <UserAvatar name={u.name} avatar={u.avatar} size={40} border={false} />
                {u.plan === 'Banned' && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full"
                    style={{ width: 16, height: 16, background: '#ef4444', border: '2px solid #0e0e1a' }}
                  >
                    <Ban size={8} style={{ color: '#fff' }} />
                  </span>
                )}
                {u.plan === 'VIP' && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full"
                    style={{ width: 16, height: 16, background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: '2px solid #0e0e1a' }}
                  >
                    <Star size={8} style={{ color: '#1a0a00' }} />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: '#f0effc' }}>{u.name}</span>
                  <span className="chip flex-shrink-0" style={planColors[u.plan]?.chip || planColors.Free.chip}>
                    {u.plan === 'Admin' && <Shield size={9} />}
                    {u.plan === 'VIP' && <Star size={9} />}
                    {u.plan}
                  </span>
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  @{u.username || '—'} · {u.region || '—'} · {u.gender || '—'} · {u.birthYear || '—'}
                </div>
              </div>

              {/* Plan changer */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {['Free', 'VIP', 'Admin', 'Banned'].map(p => (
                  <button
                    key={p}
                    disabled={actionLoading === u.tg_id}
                    onClick={() => handlePlanChange(u.tg_id, p)}
                    className="text-[11px] px-2 py-1 rounded-lg font-semibold transition-all"
                    style={{
                      background: u.plan === p ? planColors[p].bg : 'rgba(255,255,255,0.03)',
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
                  disabled={actionLoading === u.tg_id}
                  className="ml-1 flex items-center justify-center rounded-lg transition-all"
                  style={{
                    width: 28, height: 28,
                    background: 'rgba(248,113,113,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(248,113,113,0.2)',
                    cursor: actionLoading === u.tg_id ? 'not-allowed' : 'pointer',
                  }}
                  title="O'chirish"
                  aria-label="Foydalanuvchini o'chirish"
                >
                  {actionLoading === u.tg_id ? <LoaderSpinner size={12} /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-soft flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={14} />
            Oldingi
          </button>
          <span className="chip" style={{ background: 'rgba(124,90,240,0.12)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.2)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-soft flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Keyingi
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const planColors = {
  Free: {
    text: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)',
    chip: { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' },
  },
  VIP: {
    text: '#fcd34d', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)',
    chip: { background: 'rgba(245,158,11,0.14)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' },
  },
  Admin: {
    text: '#a78bfa', bg: 'rgba(124,90,240,0.14)', border: 'rgba(124,90,240,0.28)',
    chip: { background: 'rgba(124,90,240,0.14)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.25)' },
  },
  Banned: {
    text: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)',
    chip: { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
  },
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

  const FILTERS = [
    { key: 'pending', label: 'Kutilmoqda' },
    { key: 'reviewed', label: "Ko'rib chiqilgan" },
    { key: 'dismissed', label: 'Rad etilgan' },
    { key: 'warned', label: 'Ogohlantirilgan' },
    { key: 'banned', label: 'Bloklangan' },
  ];

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => {
          const active = statusFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={{
                background: active ? 'linear-gradient(135deg, rgba(124,90,240,0.28), rgba(124,90,240,0.12))' : 'rgba(255,255,255,0.04)',
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${active ? 'rgba(124,90,240,0.4)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: active ? '0 0 16px rgba(124,90,240,0.15)' : 'none',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl h-[80px] skeleton" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Shikoyatlar yo'q</div>
      ) : (
        <div className="space-y-2">
          {reports.map((r, i) => (
            <div key={r._id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <div
                className="glass glass-hover card-glow rounded-2xl p-3.5"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedReport(selectedReport?._id === r._id ? null : r)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: '#f0effc' }}>
                    {r.reporter?.name || r.reporterTgId}
                  </span>
                  <ChevronRightIcon size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <span className="text-xs font-semibold" style={{ color: '#f87171' }}>
                    {r.reported?.name || r.reportedTgId}
                  </span>
                  <span
                    className="chip ml-auto flex-shrink-0"
                    style={statusColors[r.status]?.chip || statusColors.pending.chip}
                  >
                    {statusLabels[r.status] || r.status}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {r.reason}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <Calendar size={10} />
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Expanded review panel */}
              {selectedReport?._id === r._id && (
                <div
                  className="mx-2 mb-2 rounded-2xl p-3.5 space-y-2.5 animate-slide-up"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,90,240,0.08), rgba(124,90,240,0.02))',
                    border: '1px solid rgba(124,90,240,0.15)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <div>Sabab: <span style={{ color: '#f0effc' }}>{r.reason}</span></div>
                    {r.chatContext && (
                      <div>Chat kontekst: <span style={{ color: '#f0effc' }}>{r.chatContext}</span></div>
                    )}
                  </div>
                  <input
                    className="glass rounded-xl w-full"
                    style={{
                      padding: '9px 12px', fontSize: 12, color: '#f0effc', outline: 'none',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    }}
                    placeholder="Admin izohi..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => handleReview(r._id, 'dismissed')} disabled={actionLoading === r._id}
                      className="btn-soft text-xs px-3 py-1.5 rounded-lg font-medium" style={{ cursor: 'pointer' }}>
                      ❌ Rad etish
                    </button>
                    <button onClick={() => handleReview(r._id, 'warned')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{ background: 'rgba(251,191,36,0.14)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.25)', cursor: 'pointer' }}>
                      ⚠️ Ogohlantirish
                    </button>
                    <button onClick={() => handleReview(r._id, 'banned')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer' }}>
                      🔨 Bloklash
                    </button>
                    <button onClick={() => handleReview(r._id, 'reviewed')} disabled={actionLoading === r._id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{ background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer' }}>
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
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="btn-soft flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={14} />
            Oldingi
          </button>
          <span className="chip" style={{ background: 'rgba(124,90,240,0.12)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.2)' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-soft flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            Keyingi
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const statusColors = {
  pending: { chip: { background: 'rgba(251,146,60,0.14)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' } },
  reviewed: { chip: { background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' } },
  dismissed: { chip: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' } },
  warned: { chip: { background: 'rgba(251,191,36,0.14)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.25)' } },
  banned: { chip: { background: 'rgba(248,113,113,0.14)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' } },
};
const statusLabels = {
  pending: 'Kutilmoqda', reviewed: "Ko'rib chiqilgan", dismissed: 'Rad etilgan',
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

  const selectBase = {
    padding: '11px 12px', fontSize: 13, color: '#f0effc', outline: 'none', cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    transition: 'border-color 0.2s',
  };

  const activeFilterCount = [filter.plan, filter.gender, filter.region].filter(Boolean).length;

  return (
    <div className="p-4 space-y-4">
      {/* Composer */}
      <div className="glass card-glow rounded-2xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Xabar matni</span>
          <span className="chip" style={{ background: 'rgba(124,90,240,0.12)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.2)' }}>
            {message.length}/1000
          </span>
        </div>
        <textarea
          className="rounded-xl w-full"
          style={{
            ...selectBase, minHeight: 130, resize: 'none', lineHeight: 1.6, fontSize: 14, padding: '14px 16px',
          }}
          placeholder="Barcha foydalanuvchilarga yuboriladigan xabarni kiriting..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={1000}
        />
      </div>

      {/* Filters */}
      <div className="glass card-glow rounded-2xl p-4 space-y-3 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Filter</span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>(ixtiyoriy)</span>
          {activeFilterCount > 0 && (
            <span className="chip ml-auto" style={{ background: 'rgba(124,90,240,0.15)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.25)' }}>
              {activeFilterCount} ta faol
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select style={selectBase} value={filter.plan} onChange={e => setFilter(f => ({ ...f, plan: e.target.value }))}>
            <option value="" style={{ background: '#12121f' }}>Barcha plan</option>
            <option value="Free" style={{ background: '#12121f' }}>Free</option>
            <option value="VIP" style={{ background: '#12121f' }}>VIP</option>
            <option value="Admin" style={{ background: '#12121f' }}>Admin</option>
          </select>
          <select style={selectBase} value={filter.gender} onChange={e => setFilter(f => ({ ...f, gender: e.target.value }))}>
            <option value="" style={{ background: '#12121f' }}>Barcha jins</option>
            <option value="Erkak" style={{ background: '#12121f' }}>Erkak</option>
            <option value="Ayol" style={{ background: '#12121f' }}>Ayol</option>
          </select>
          <select style={selectBase} value={filter.region} onChange={e => setFilter(f => ({ ...f, region: e.target.value }))}>
            <option value="" style={{ background: '#12121f' }}>Barcha viloyat</option>
            {REGIONS_FILTER.map(r => (
              <option key={r} value={r} style={{ background: '#12121f' }}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="btn-glow w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ cursor: sending || !message.trim() ? 'not-allowed' : 'pointer', opacity: sending || !message.trim() ? 0.5 : 1 }}
      >
        {sending ? <><LoaderSpinner /> Yuborilmoqda...</> : <><Send size={16} /> Xabarni yuborish</>}
      </button>

      {result && (
        <div
          className="rounded-2xl p-4 text-sm animate-bounce-in"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.22)',
            color: '#6ee7b7',
            boxShadow: '0 0 24px rgba(16,185,129,0.08)',
          }}
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckIcon />
            Xabar {result.recipientCount} ta foydalanuvchiga yuborildi!
          </div>
          {/* 🔴 16-FIX: backend `recipients` ro'yxatini qaytarmaydi (faqat recipientCount
              va jobId) — broadcast asinxron queue orqali ishlaydi, shuning uchun
              nomlar ro'yxati hech qachon ko'rinmasdi. UI'dan olib tashlandi. */}
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
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: 'transparent' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Siz admin emassiz</p>
      </div>
    );
  }

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: 'transparent' }}>
      {/* Header */}
      <header className="glass-strong flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-20" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 20-FIX: inline style o'rniga CSS class (.icon-btn-back) */}
        <IconButton onClick={() => navigate('/settings')} className="icon-btn-back" aria-label="Go back">
          <BackIcon />
        </IconButton>
        <div>
          <span className="gradient-text text-sm font-bold">Admin Panel</span>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(124,90,240,0.65)' }}>
            {TABS.find(t => t.key === activeTab)?.label}
          </div>
        </div>
        <span className="chip ml-auto flex items-center gap-1" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          <Shield size={10} />
          Admin
        </span>
      </header>

      {/* Tab navigation — pill with sliding indicator */}
      <div className="sticky top-[76px] z-10 px-3 pt-3 pb-3" style={{ background: 'transparent' }}>
        <div className="glass-strong rounded-2xl p-1 flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1"
                style={{
                  background: active ? 'linear-gradient(135deg, #7c5af0, #6d4bd6)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: active ? '0 6px 20px rgba(124,90,240,0.35)' : 'none',
                  cursor: 'pointer',
                }}
                aria-label={tab.label}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
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
