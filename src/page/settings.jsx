import { useState, useEffect, useRef } from 'react';
import {
  BackIcon, ChevronRight, StarIcon, SupportIcon, CheckIcon,
} from '../assets/icon';
import { Users, Sliders, Shield } from 'lucide-react';
import { PlanBadge } from '../components/PlanBadge';
import { UserAvatar } from '../components/Avatar';
import { VIPOnlineUsers } from '../components/VIPOnlineUsers';
import { IconButton } from '../components/IconButton';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  updateUserProfile, uploadImage, resolveAvatarUrl,
  updatePreferredGender, updateVIPPreferences,
} from '../services/api';

const REGIONS = [
  "Toshkent sh.", "Toshkent vil.", "Samarqand", "Buxoro",
  "Farg'ona", "Andijon", "Namangan", "Qashqadaryo",
  "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Xorazm", "Qoraqalpog'iston",
];

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
};

const backButtonStyle = {
  width: 36, height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', flexShrink: 0,
};

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LoaderSpinner({ size = 18 }) {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Section Header Component ────────────────────────────────────────────────

function SectionHeader({ icon, label, sub, accent = false, onClick, rightIcon }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        background: hover ? 'rgba(124,90,240,0.08)' : 'transparent',
        cursor: 'pointer',
        border: 'none',
        borderRadius: 16,
      }}
    >
      <span
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: 38, height: 38,
          background: accent ? 'rgba(245,158,11,0.15)' : 'rgba(124,90,240,0.15)',
          color: accent ? '#f59e0b' : '#a78bfa',
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: accent ? '#fcd34d' : '#f0effc' }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {sub}
          </div>
        )}
      </div>
      {rightIcon || <ChevronRight />}
    </button>
  );
}

// ── Section Card Wrapper ────────────────────────────────────────────────────

function SectionCard({ children, style, className = '' }) {
  return (
    <div className={`mx-4 mb-3 rounded-2xl overflow-hidden ${className}`} style={{ ...sectionStyle, ...style }}>
      {children}
    </div>
  );
}

// ── Main Settings Page ──────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const fileInputRef = useRef(null);

  const [currentAvatar, setCurrentAvatar] = useState(resolveAvatarUrl(user?.avatar));
  const [name, setName] = useState(user?.name || '');
  const [region, setRegion] = useState(user?.region || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [changedFields, setChangedFields] = useState({});

  // Filter accordion state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersContentRef = useRef(null);
  const [filtersHeight, setFiltersHeight] = useState(0);

  // Active filter count
  const activeFilterCount = [
    user?.preferredGender && user?.preferredGender !== 'all',
    user?.preferredMinAge,
    user?.preferredMaxAge,
    user?.preferredRegion,
  ].filter(Boolean).length;

  // Accordion ochilganda height ni o'lchash
  useEffect(() => {
    if (filtersContentRef.current) {
      setFiltersHeight(filtersContentRef.current.scrollHeight);
    }
  }, [filtersOpen, user?.preferredGender, user?.preferredMinAge, user?.preferredMaxAge, user?.preferredRegion]);

  const clearAllFilters = async () => {
    try {
      await updateVIPPreferences(user?.tg_id, {
        preferredGender: null,
        preferredMinAge: null,
        preferredMaxAge: null,
        preferredRegion: null,
      });
      await refreshUser();
    } catch (err) {
      console.error('Clear filters error:', err);
    }
  };

  useEffect(() => {
    setCurrentAvatar(resolveAvatarUrl(user?.avatar));
    setName(user?.name || '');
    setRegion(user?.region || '');
  }, [user?.avatar, user?.name, user?.region]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCurrentAvatar(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file);
      if (result?.mediaUrl) {
        const fullUrl = resolveAvatarUrl(result.mediaUrl);
        setCurrentAvatar(fullUrl);
        setChangedFields(prev => ({ ...prev, avatar: fullUrl }));
      }
    } catch (err) {
      setError(err.message || 'Rasm yuklanmadi');
      setCurrentAvatar(resolveAvatarUrl(user?.avatar));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.tg_id) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Ism kamida 2 harfdan iborat bo\'lishi kerak');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updates = {};
      if (changedFields.name) updates.name = trimmedName;
      if (changedFields.region) updates.region = region;
      if (changedFields.avatar) updates.avatar = changedFields.avatar;
      if (Object.keys(updates).length === 0) {
        setIsEditing(false); setSaving(false); return;
      }
      const updatedUser = await updateUserProfile(user.tg_id, updates);
      if (updatedUser) {
        setSuccess(true);
        setChangedFields({});
        setTimeout(() => setSuccess(false), 2500);
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setRegion(user?.region || '');
    setCurrentAvatar(resolveAvatarUrl(user?.avatar));
    setChangedFields({});
    setError('');
    setIsEditing(false);
    setShowRegionPicker(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0effc',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputFocusStyle = {
    borderColor: 'rgba(124,90,240,0.5)',
    boxShadow: '0 0 0 3px rgba(124,90,240,0.15)',
  };

  const isVip = user?.plan === 'VIP';

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: '#0a0a12' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <IconButton
          onClick={() => (isEditing ? handleCancel() : navigate('/'))}
          className="rounded-xl"
          style={backButtonStyle}
          aria-label="Go back"
        >
          <BackIcon />
        </IconButton>
        <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
          {isEditing ? 'Profilni tahrirlash' : 'Sozlamalar'}
        </span>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(124,90,240,0.15)',
              color: '#a78bfa',
              border: '1px solid rgba(124,90,240,0.2)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.15)'; }}
          >
            <EditIcon />
            Tahrirlash
          </button>
        )}
      </header>

      {/* Toast messages */}
      {success && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium animate-bounce-in"
          style={{
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#6ee7b7',
            backdropFilter: 'blur(12px)',
          }}
        >
          <CheckIcon />
          {typeof success === 'string' ? success : "Profil muvaffaqiyatli yangilandi!"}
        </div>
      )}
      {error && !isEditing && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium animate-bounce-in"
          style={{
            background: 'rgba(248,113,113,0.2)',
            border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171',
            backdropFilter: 'blur(12px)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <div
        className="mx-4 mt-5 mb-4 rounded-2xl flex flex-col items-center py-6 px-4 relative overflow-hidden"
        style={sectionStyle}
      >
        {/* Radial glow */}
        {isEditing && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(124,90,240,0.06) 0%, transparent 60%)' }}
          />
        )}

        <div className="relative" style={{ marginBottom: isEditing ? 4 : 0 }}>
          <div
            className="relative"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{ cursor: isEditing ? 'pointer' : 'default' }}
            onClick={isEditing ? handleAvatarClick : undefined}
          >
            <UserAvatar
              name={user?.name}
              avatar={currentAvatar || user?.avatar}
              size={isEditing ? 88 : 76}
              border={false}
            />
            {isEditing && (
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: avatarHover ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
                  opacity: avatarHover || uploading ? 1 : 0,
                }}
              >
                {uploading ? <div style={{ color: '#fff' }}><LoaderSpinner /></div> : <div style={{ color: '#fff', transform: 'scale(1.2)' }}><CameraIcon /></div>}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          {isVip && (
            <div
              className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full"
              style={{
                width: 22, height: 22,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: '0 0 8px rgba(245,158,11,0.5)',
              }}
            >
              <StarIcon size={12} />
            </div>
          )}
        </div>

        {/* Editing form */}
        {isEditing ? (
          <div className="w-full mt-4 space-y-3" style={{ maxWidth: 320 }}>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Ism familiya</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); setChangedFields(prev => ({ ...prev, name: true })); setError(''); }}
                placeholder="Ismingizni kiriting" style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Viloyat</label>
              <div className="relative">
                <button type="button" onClick={() => setShowRegionPicker(!showRegionPicker)}
                  style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
                    borderColor: showRegionPicker ? 'rgba(124,90,240,0.5)' : 'rgba(255,255,255,0.1)',
                    boxShadow: showRegionPicker ? '0 0 0 3px rgba(124,90,240,0.15)' : 'none',
                    color: region ? '#f0effc' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  <span>{region || 'Viloyatingizni tanlang'}</span>
                  <span style={{ transform: showRegionPicker ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'rgba(255,255,255,0.4)' }}>
                    <ChevronDown open={showRegionPicker} />
                  </span>
                </button>
                {showRegionPicker && (
                  <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden animate-slide-up"
                    style={{ background: '#15151f', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto' }}
                  >
                    {REGIONS.map((r) => (
                      <button key={r} type="button" onClick={() => { setRegion(r); setChangedFields(prev => ({ ...prev, region: true })); setShowRegionPicker(false); setError(''); }}
                        className="w-full text-left px-4 py-3 text-sm transition-colors"
                        style={{ color: region === r ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                          background: region === r ? 'rgba(124,90,240,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { if (region !== r) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { if (region !== r) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{r}</span>
                          {region === r && <span style={{ color: '#a78bfa' }}><CheckIcon /></span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <div className="text-xs mt-1 animate-shake" style={{ color: '#f87171' }}>{error}</div>}

            <div className="flex gap-2 pt-2">
              <button onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                Bekor qilish
              </button>
              <button onClick={handleSave} disabled={saving || Object.keys(changedFields).length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: saving ? 'rgba(124,90,240,0.4)' : 'linear-gradient(135deg, #7c5af0, #6d4bd6)',
                  border: 'none', color: '#fff', cursor: saving || Object.keys(changedFields).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(changedFields).length === 0 ? 0.5 : 1 }}
                onMouseEnter={(e) => { if (!saving && Object.keys(changedFields).length > 0) e.currentTarget.style.background = 'linear-gradient(135deg, #8c6af8, #7d5be6)'; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = 'linear-gradient(135deg, #7c5af0, #6d4bd6)'; }}
              >
                {saving ? <><LoaderSpinner /> Saqlanmoqda...</> : 'Saqlash'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3 text-base font-semibold" style={{ color: '#f0effc' }}>{user?.name}</div>
            <div className="text-xs mt-0.5 mb-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{user?.username}</div>
            <div className="flex items-center gap-1.5 text-xs mt-1 mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{user?.region || "Viloyat ko'rsatilmagan"}</span>
            </div>
            <PlanBadge plan={user?.plan} />
          </>
        )}
      </div>

      {/* ── Settings Sections ────────────────────────────────────────────── */}
      {!isEditing && (
        <div className="pb-6 space-y-3">
          {/* ──────── SECTION: Chat History ──────── */}
          {isVip && (
            <SectionCard>
              <SectionHeader
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" />
                  </svg>
                }
                label="Chat tarixi"
                sub="O'tgan suhbatlaringizni ko'ring va qayta boshlang"
                onClick={() => navigate('/chat-history')}
                rightIcon={
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                      VIP
                    </span>
                    <ChevronRight />
                  </span>
                }
              />
            </SectionCard>
          )}

          {/* ──────── SECTION: Filters (Accordion) ──────── */}
          {isVip && (
            <SectionCard>
              <SectionHeader
                icon={<Sliders size={18} />}
                label="Filtrlash"
                sub={
                  activeFilterCount > 0
                    ? `${activeFilterCount} ta filtr faol · Jins · Yosh · Viloyat`
                    : `Jins · Yosh oralig'i · Viloyat`
                }
                accent
                onClick={() => setFiltersOpen(!filtersOpen)}
                rightIcon={
                  <div className="flex items-center gap-2">
                    {/* Active filter count badge */}
                    {activeFilterCount > 0 && (
                      <span
                        className="flex items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          width: 20, height: 20,
                          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                          color: '#1a0a00',
                          boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                          animation: 'heartbeat 2s ease-in-out infinite',
                        }}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                      VIP
                    </span>
                    <ChevronDown open={filtersOpen} />
                  </div>
                }
              />

              {/* Accordion content — auto-height animation */}
              <div
                className="overflow-hidden transition-all duration-400 ease-out"
                style={{
                  maxHeight: filtersOpen ? filtersHeight || 600 : 0,
                  opacity: filtersOpen ? 1 : 0,
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                }}
              >
                <div ref={filtersContentRef}>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

                  {/* Active filter chips */}
                  {activeFilterCount > 0 && (
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user?.preferredGender && user?.preferredGender !== 'all' && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                            style={{
                              background: 'rgba(124,90,240,0.15)',
                              border: '1px solid rgba(124,90,240,0.25)',
                              color: '#a78bfa',
                            }}
                          >
                            {user?.preferredGender === 'Erkak' ? '♂️ Erkak' : '♀️ Ayol'}
                          </span>
                        )}
                        {(user?.preferredMinAge || user?.preferredMaxAge) && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              border: '1px solid rgba(16,185,129,0.25)',
                              color: '#6ee7b7',
                            }}
                          >
                            {user?.preferredMinAge || '15'}–{user?.preferredMaxAge || '100'} yosh
                          </span>
                        )}
                        {user?.preferredRegion && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                            style={{
                              background: 'rgba(245,158,11,0.15)',
                              border: '1px solid rgba(245,158,11,0.25)',
                              color: '#fcd34d',
                            }}
                          >
                            📍 {user?.preferredRegion}
                          </span>
                        )}
                        <button
                          onClick={clearAllFilters}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        >
                          ✕ Tozalash
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gender filter */}
                  <div
                    className="px-4 py-3"
                    style={{
                      animation: filtersOpen ? 'fade-in-up 0.35s ease forwards' : 'none',
                      opacity: 0,
                    }}
                  >
                    <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} />
                        Jins bo'yicha filtrlash
                      </span>
                    </label>
                    <VIPGenderFilterInline
                      currentGender={user?.preferredGender}
                      tgId={user?.tg_id}
                      refreshUser={refreshUser}
                    />
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

                  {/* Advanced filters */}
                  <div
                    className="px-4 py-3 space-y-3"
                    style={{
                      animation: filtersOpen ? 'fade-in-up 0.35s ease 0.1s forwards' : 'none',
                      opacity: 0,
                    }}
                  >
                    <label className="text-xs font-medium block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Yosh oralig'i va viloyat
                    </label>
                    <VIPAdvancedFiltersInline
                      user={user}
                      tgId={user?.tg_id}
                      refreshUser={refreshUser}
                    />
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

                  {/* Online users (manual refresh, 1min auto-cleanup) */}
                  <div
                    style={{
                      animation: filtersOpen ? 'fade-in-up 0.35s ease 0.2s forwards' : 'none',
                      opacity: 0,
                    }}
                  >
                    <VIPOnlineUsers currentUser={user} forceVisible />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ──────── SECTION: Subscribe ──────── */}
          <SectionCard>
            <SectionHeader
              icon={<StarIcon />}
              label="Obuna bo'lish"
              sub={isVip ? "VIP a'zolik faollashtirilgan" : "VIP bo'ling va barcha imkoniyatlardan foydalaning"}
              accent
              onClick={() => {
                setSuccess('VIP a\'zolik haqida ma\'lumot tez orada!');
                setTimeout(() => setSuccess(false), 3000);
              }}
            />
          </SectionCard>

          {/* ──────── SECTION: Support ──────── */}
          <SectionCard>
            <SectionHeader
              icon={<SupportIcon />}
              label="Xizmat ko'rsatish"
              sub="Xatoliklar, takliflar yoki yordam uchun murojaat qiling"
              onClick={() => {
                const msg = 'Yordam uchun: @admin yoki Telegram bot orqali murojaat qiling.';
                setError(msg);
                setTimeout(() => setError(''), 4000);
              }}
            />
          </SectionCard>

          {/* ──────── Admin Panel ──────── */}
          {user?.plan === 'Admin' && (
            <SectionCard>
              <SectionHeader
                icon={<Shield size={18} />}
                label="Admin panel"
                sub="Foydalanuvchilar, shikoyatlar va statistika"
                onClick={() => navigate('/admin')}
                rightIcon={
                  <span className="flex items-center gap-1" style={{ color: '#f87171' }}>
                    <span className="text-[10px] font-semibold">Admin</span>
                    <ChevronRight />
                  </span>
                }
              />
            </SectionCard>
          )}

          {/* Version info */}
          <div className="text-center pt-4 pb-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            v1.0.0 · Telegram Web App
          </div>
        </div>
      )}

      {/* Overlay for region picker */}
      {showRegionPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} style={{ background: 'transparent' }} />
      )}
    </div>
  );
}

// ── VIP: Gender filter (inline, no card wrapper) ──────────────────────────

function VIPGenderFilterInline({ currentGender, tgId, refreshUser }) {
  const [selected, setSelected] = useState(currentGender || 'all');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(currentGender || 'all'); }, [currentGender]);

  const options = [
    { value: 'all', label: "Farqi yo'q", icon: '🌍' },
    { value: 'Erkak', label: 'Erkaklar', icon: '♂️' },
    { value: 'Ayol', label: 'Ayollar', icon: '♀️' },
  ];

  const handleChange = async (value) => {
    if (value === selected) return;
    setSelected(value);
    setSaving(true);
    try {
      await updatePreferredGender(tgId, value === 'all' ? null : value);
      await refreshUser();
    } catch (err) {
      console.error('Gender filter error:', err);
      setSelected(currentGender || 'all');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-1 justify-center"
          style={{
            background: selected === opt.value ? 'rgba(124,90,240,0.2)' : 'rgba(255,255,255,0.04)',
            border: selected === opt.value ? '1px solid rgba(124,90,240,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: selected === opt.value ? '#a78bfa' : 'rgba(255,255,255,0.5)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (selected !== opt.value && !saving) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={(e) => { if (selected !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
      {saving && <LoaderSpinner size={14} />}
    </div>
  );
}

// ── VIP: Advanced filters (inline, no card wrapper) ──────────────────────

function VIPAdvancedFiltersInline({ user, tgId, refreshUser }) {
  const [minAge, setMinAge] = useState(user?.preferredMinAge || '');
  const [maxAge, setMaxAge] = useState(user?.preferredMaxAge || '');
  const [region, setRegion] = useState(user?.preferredRegion || '');
  const [savingAge, setSavingAge] = useState(false);
  const [savingRegion, setSavingRegion] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const handleSaveAge = async (field, value) => {
    setSavingAge(true);
    try {
      await updateVIPPreferences(tgId, { [field]: value || null });
      await refreshUser();
    } catch (err) { console.error('VIP filter error:', err); }
    finally { setSavingAge(false); }
  };

  const handleSaveRegion = async (value) => {
    setSavingRegion(true);
    try {
      await updateVIPPreferences(tgId, { preferredRegion: value || null });
      await refreshUser();
    } catch (err) { console.error('VIP filter error:', err); }
    finally { setSavingRegion(false); }
  };

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0effc',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <>
      {/* Age range */}
      <div className="flex items-center gap-2 mb-3">
        <input type="number" min={15} max={100} placeholder="15" value={minAge}
          onChange={e => setMinAge(e.target.value)}
          onBlur={() => handleSaveAge('preferredMinAge', minAge ? Number(minAge) : null)}
          style={{ ...inputBase, width: 64 }}
        />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>—</span>
        <input type="number" min={15} max={100} placeholder="60" value={maxAge}
          onChange={e => setMaxAge(e.target.value)}
          onBlur={() => handleSaveAge('preferredMaxAge', maxAge ? Number(maxAge) : null)}
          style={{ ...inputBase, width: 64 }}
        />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>yosh</span>
        {savingAge && <LoaderSpinner size={14} />}
      </div>

      {/* Region filter */}
      <div className="relative">
        <button type="button" onClick={() => setShowRegionPicker(!showRegionPicker)}
          style={{
            ...inputBase, width: '100%', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            color: region ? '#f0effc' : 'rgba(255,255,255,0.3)',
          }}
        >
          <span>{region || 'Viloyat tanlanmagan (hamma)'}</span>
          <div className="flex items-center gap-1.5">
            {savingRegion && <LoaderSpinner size={14} />}
            <ChevronDown open={showRegionPicker} />
          </div>
        </button>

        {showRegionPicker && (
          <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden animate-slide-up"
            style={{ background: '#15151f', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: 200, overflowY: 'auto' }}
          >
            <button type="button" onClick={() => { setRegion(''); setShowRegionPicker(false); handleSaveRegion(null); }}
              className="w-full text-left px-4 py-2.5 text-xs transition-colors"
              style={{ color: !region ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                background: !region ? 'rgba(124,90,240,0.1)' : 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              Hamma viloyatlar
            </button>
            {REGIONS.map((r) => (
              <button key={r} type="button" onClick={() => { setRegion(r); setShowRegionPicker(false); handleSaveRegion(r); }}
                className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                style={{ color: region === r ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                  background: region === r ? 'rgba(124,90,240,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { if (region !== r) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { if (region !== r) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex items-center justify-between">
                  <span>{r}</span>
                  {region === r && <CheckIcon style={{ color: '#a78bfa' }} />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay */}
      {showRegionPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} style={{ background: 'transparent' }} />
      )}
    </>
  );
}
