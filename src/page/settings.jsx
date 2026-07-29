import { Fragment, useState, useEffect, useRef } from 'react';
import { BackIcon, ChevronRight, StarIcon, SupportIcon, ImageIcon, CheckIcon, SettingsIcon } from '../assets/icon';
import { Users } from 'lucide-react';
import { PlanBadge } from '../components/PlanBadge';
import { UserAvatar } from '../components/Avatar';
import { VIPOnlineUsers } from '../components/VIPOnlineUsers';
import { IconButton } from '../components/IconButton';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { updateUserProfile, uploadImage, resolveAvatarUrl, updatePreferredGender, updateVIPPreferences } from '../services/api';

const REGIONS = [
  "Toshkent sh.", "Toshkent vil.", "Samarqand", "Buxoro",
  "Farg'ona", "Andijon", "Namangan", "Qashqadaryo",
  "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Xorazm", "Qoraqalpog'iston"
];

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const backButtonStyle = {
  width: 36,
  height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  flexShrink: 0,
};

const settingsRows = [
  {
    icon: <StarIcon />,
    label: "Obuna bo'lish",
    sub: "Obuna bo'lish orqali cheklovlarni olib tashlang",
    accent: true,
  },
  {
    icon: <SupportIcon />,
    label: "Xizmat ko'rsatish",
    sub: "Xatoliklar, takliflar yoki yordam uchun murojaat qiling",
  },
];

const adminRow = {
  icon: <SettingsIcon />,
  label: "Admin Panel",
  sub: "Foydalanuvchilar, shikoyatlar va statistika",
  accent: false,
};

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

function LoaderSpinner() {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width="18" height="18">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SettingsRow({ icon, label, sub, accent, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        background: hover ? 'rgba(124,90,240,0.1)' : 'transparent',
        cursor: 'pointer',
        border: 'none',
      }}
    >
      <span
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: 38,
          height: 38,
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
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {sub}
          </div>
        )}
      </div>
      <ChevronRight />
    </button>
  );
}

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

  useEffect(() => {
    setCurrentAvatar(resolveAvatarUrl(user?.avatar));
    setName(user?.name || '');
    setRegion(user?.region || '');
  }, [user?.avatar, user?.name, user?.region]);

  // Avatar tanlash
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCurrentAvatar(ev.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
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

  // Saqlash
  const handleSave = async () => {
    if (!user?.tg_id) return;

    // Validate name
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
        setIsEditing(false);
        setSaving(false);
        return;
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

  // Bekor qilish
  const handleCancel = () => {
    setName(user?.name || '');
    setRegion(user?.region || '');      setCurrentAvatar(resolveAvatarUrl(user?.avatar));
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

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh' }}>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,90,240,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(124,90,240,0.15)';
            }}
          >
            <EditIcon />
            Tahrirlash
          </button>
        )}
      </header>

      {/* Success toast */}
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
          Profil muvaffaqiyatli yangilandi!
        </div>
      )}

      {/* Profile Card */}
      <div
        className="mx-4 mt-5 mb-2 rounded-2xl flex flex-col items-center py-6 px-4 relative overflow-hidden"
        style={sectionStyle}
      >
        {isEditing && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(124,90,240,0.06) 0%, transparent 60%)',
            }}
          />
        )}

        {/* Avatar */}
        <div className="relative" style={{ marginBottom: isEditing ? 4 : 0 }}>
          <div
            className="relative"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{ cursor: isEditing ? 'pointer' : 'default' }}
            onClick={isEditing ? handleAvatarClick : undefined}
          >
            {/* UserAvatar handles loading, initials, and real image */}
            <UserAvatar
              name={user?.name}
              avatar={currentAvatar || user?.avatar}
              size={isEditing ? 88 : 76}
              border={false}
            />

            {/* Upload overlay */}
            {isEditing && (
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: avatarHover ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
                  opacity: avatarHover || uploading ? 1 : 0,
                }}
              >
                {uploading ? (
                  <div style={{ color: '#fff' }}>
                    <LoaderSpinner />
                  </div>
                ) : (
                  <div style={{ color: '#fff', transform: 'scale(1.2)' }}>
                    <CameraIcon />
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {user?.plan === 'VIP' && (
            <div
              className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: '0 0 8px rgba(245,158,11,0.5)',
              }}
            >
              <StarIcon />
            </div>
          )}
        </div>

        {/* Editing form */}
        {isEditing ? (
          <div className="w-full mt-4 space-y-3" style={{ maxWidth: 320 }}>
            {/* Name field */}
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Ism familiya
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setChangedFields(prev => ({ ...prev, name: true }));
                  setError('');
                }}
                placeholder="Ismingizni kiriting"
                style={inputStyle}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, inputFocusStyle);
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                maxLength={50}
              />
            </div>

            {/* Region selector */}
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Viloyat
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRegionPicker(!showRegionPicker)}
                  style={{
                    ...inputStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderColor: showRegionPicker ? 'rgba(124,90,240,0.5)' : 'rgba(255,255,255,0.1)',
                    boxShadow: showRegionPicker ? '0 0 0 3px rgba(124,90,240,0.15)' : 'none',
                    color: region ? '#f0effc' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  <span>{region || 'Viloyatingizni tanlang'}</span>
                  <span style={{
                    transform: showRegionPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    <ChevronDown />
                  </span>
                </button>

                {showRegionPicker && (
                  <div
                    className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden animate-slide-up"
                    style={{
                      background: '#15151f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}
                  >
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRegion(r);
                          setChangedFields(prev => ({ ...prev, region: true }));
                          setShowRegionPicker(false);
                          setError('');
                        }}
                        className="w-full text-left px-4 py-3 text-sm transition-colors"
                        style={{
                          color: region === r ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                          background: region === r ? 'rgba(124,90,240,0.1)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (region !== r) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                        onMouseLeave={(e) => {
                          if (region !== r) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{r}</span>
                          {region === r && (
                            <span style={{ color: '#a78bfa' }}>
                              <CheckIcon />
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="text-xs mt-1 animate-shake"
                style={{ color: '#f87171' }}
              >
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(changedFields).length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: saving
                    ? 'rgba(124,90,240,0.4)'
                    : 'linear-gradient(135deg, #7c5af0, #6d4bd6)',
                  border: 'none',
                  color: '#fff',
                  cursor: saving || Object.keys(changedFields).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(changedFields).length === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving && Object.keys(changedFields).length > 0) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8c6af8, #7d5be6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7c5af0, #6d4bd6)';
                  }
                }}
              >
                {saving ? (
                  <>
                    <LoaderSpinner />
                    Saqlanmoqda...
                  </>
                ) : (
                  'Saqlash'
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Display mode */}
            <div className="mt-3 text-base font-semibold" style={{ color: '#f0effc' }}>
              {user?.name}
            </div>
            <div className="text-xs mt-0.5 mb-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {user?.username}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs mt-1 mb-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{user?.region || "Viloyat ko'rsatilmagan"}</span>
            </div>
            <PlanBadge plan={user?.plan} />
          </>
        )}
      </div>

      {/* Settings rows - only show when not editing */}
      {!isEditing && (
        <>
          {/* Admin panel row (only for admin) */}
          {user?.plan === 'Admin' && (
            <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={sectionStyle}>
              <SettingsRow
                icon={adminRow.icon}
                label={adminRow.label}
                sub={adminRow.sub}
                accent={adminRow.accent}
                onClick={() => navigate('/admin')}
              />
            </div>
          )}

          {/* VIP: Chat History link */}
          {user?.plan === 'VIP' && (
            <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={sectionStyle}>
              <SettingsRow
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" />
                  </svg>
                }
                label="Chat tarixi"
                sub="O'tgan suhbatlaringizni ko'ring"
                accent={false}
                onClick={() => navigate('/chat-history')}
              />
            </div>
          )}

          {/* VIP: Online Users (to'g'ridan-to'g'ri suhbat) */}
          {user?.plan === 'VIP' && (
            <VIPOnlineUsers currentUser={user} />
          )}

          {/* VIP: Kengaytirilgan filtrlash */}
          {user?.plan === 'VIP' && (
            <>
              <VIPGenderFilter
                currentGender={user?.preferredGender}
                tgId={user?.tg_id}
                refreshUser={refreshUser}
              />
              <VIPAdvancedFilters
                user={user}
                tgId={user?.tg_id}
                refreshUser={refreshUser}
              />
            </>
          )}

          <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={sectionStyle}>
            {settingsRows.map((row, index) => (
              <Fragment key={row.label}>
                {index > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />}
                <SettingsRow icon={row.icon} label={row.label} sub={row.sub} accent={row.accent} onClick={() => {}} />
              </Fragment>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto pb-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        v1.0.0 · Telegram Web App
      </div>

      {/* Click outside to close region picker */}
      {showRegionPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRegionPicker(false)}
          style={{ background: 'transparent' }}
        />
      )}
    </div>
  );
}

// ── VIP: Kengaytirilgan filtrlash (yosh + viloyat) ────────────────────────

function VIPAdvancedFilters({ user, tgId, refreshUser }) {
  const [minAge, setMinAge] = useState(user?.preferredMinAge || '');
  const [maxAge, setMaxAge] = useState(user?.preferredMaxAge || '');
  const [region, setRegion] = useState(user?.preferredRegion || '');
  const [saving, setSaving] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const handleSave = async (field, value) => {
    setSaving(true);
    try {
      await updateVIPPreferences(tgId, { [field]: value || null });
      await refreshUser();
    } catch (err) {
      console.error('VIP filter error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-4 mt-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'visible' }}>
      {/* Header */}
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: '#fcd34d' }}>
              Kengaytirilgan filtrlash
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              VIP: yosh oralig'i va viloyat bo'yicha saralash
            </div>
          </div>
          {saving && (
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width="16" height="16">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Age range */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Yosh oralig'i
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={15}
              max={100}
              placeholder="15"
              value={minAge}
              onChange={e => setMinAge(e.target.value)}
              onBlur={() => handleSave('preferredMinAge', minAge ? Number(minAge) : null)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0effc',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                width: 70,
                outline: 'none',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>—</span>
            <input
              type="number"
              min={15}
              max={100}
              placeholder="60"
              value={maxAge}
              onChange={e => setMaxAge(e.target.value)}
              onBlur={() => handleSave('preferredMaxAge', maxAge ? Number(maxAge) : null)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0effc',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                width: 70,
                outline: 'none',
              }}
            />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>yosh</span>
          </div>
        </div>

        {/* Region filter */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Viloyat bo'yicha filtrlash
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRegionPicker(!showRegionPicker)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: region ? '#f0effc' : 'rgba(255,255,255,0.3)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{region || 'Viloyat tanlanmagan (hamma)'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{
                transform: showRegionPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'rgba(255,255,255,0.4)',
              }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showRegionPicker && (
              <div
                className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden animate-slide-up"
                style={{
                  background: '#15151f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setRegion('');
                    setShowRegionPicker(false);
                    handleSave('preferredRegion', null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                  style={{
                    color: !region ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    background: !region ? 'rgba(124,90,240,0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  Hamma viloyatlar
                </button>
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRegion(r);
                      setShowRegionPicker(false);
                      handleSave('preferredRegion', r);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                    style={{
                      color: region === r ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                      background: region === r ? 'rgba(124,90,240,0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (region !== r) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (region !== r) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{r}</span>
                      {region === r && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#a78bfa' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {showRegionPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} style={{ background: 'transparent' }} />
      )}
    </div>
  );
}

// ── VIP: Jins bo'yicha filtrlash komponenti ──────────────────────────────

function VIPGenderFilter({ currentGender, tgId, refreshUser }) {
  const [selected, setSelected] = useState(currentGender || 'all');
  const [saving, setSaving] = useState(false);

  // Prop o'zgarganda synclash (refreshUser dan keyin)
  useEffect(() => {
    setSelected(currentGender || 'all');
  }, [currentGender]);

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
      const prefGender = value === 'all' ? null : value;
      await updatePreferredGender(tgId, prefGender);
      await refreshUser();
    } catch (err) {
      console.error('Gender filter error:', err);
      setSelected(currentGender || 'all');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={sectionStyle}>
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
            }}
          >
            <Users size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: '#fcd34d' }}>
              Jins bo'yicha filtrlash
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              VIP funksiya: kim bilan suhbatlashishni tanlang
            </div>
          </div>
          {saving && (
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width="16" height="16">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex gap-2 px-4 py-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex-1 justify-center"
            style={{
              background: selected === opt.value
                ? 'rgba(124,90,240,0.2)'
                : 'rgba(255,255,255,0.04)',
              border: selected === opt.value
                ? '1px solid rgba(124,90,240,0.4)'
                : '1px solid rgba(255,255,255,0.06)',
              color: selected === opt.value ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (selected !== opt.value && !saving) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== opt.value) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
