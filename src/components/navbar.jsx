import { PlanBadge } from './PlanBadge';
import { useCurrentUser } from '../hooks/useCurrentUser';

const headerStyle = { borderBottom: '1px solid rgba(255,255,255,0.06)' };
const avatarStyle = {
  width: 38,
  height: 38,
  border: '2px solid rgba(124,90,240,0.6)',
  boxShadow: '0 0 10px rgba(124,90,240,0.3)',
};

export function Navbar() {
  const user = useCurrentUser();

  if (!user) {
    return (
      <header className="flex items-center justify-between px-4 pt-4 pb-3" style={headerStyle}>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Yuklanmoqda... (Yoki botdan /start bosing)
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3" style={headerStyle}>
      <div className="flex items-center gap-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="rounded-full object-cover flex-shrink-0"
          style={avatarStyle}
        />
        <div>
          <div className="text-sm font-semibold leading-tight" style={{ color: '#f0effc' }}>
            {user.name}
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {user.username}
          </div>
        </div>
      </div>
      <PlanBadge plan={user.plan} />
    </header>
  );
}

export default Navbar;