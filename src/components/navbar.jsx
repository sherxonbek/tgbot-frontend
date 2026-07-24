// import { USERS } from "../config/bd"; // USERS massivini import qilamiz
import { fetchUser } from "../services/api";
import { PlanBadge } from "./PlanBadge";

//fetch qilingan user ma'lumotlarini olish
const fetchCurrentUser = async () => {
  const user = await fetchUser();
  console.log("Current User:", user);
  return user;
};

export function Navbar() {
    return (
        <>
            {/* navbar */}
            <header
                className="flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-3">
                    <img
                        src={fetchCurrentUser.avatar}
                        alt={fetchCurrentUser.name}
                        className="rounded-full object-cover flex-shrink-0"
                        style={{
                            width: 38,
                            height: 38,
                            border: '2px solid rgba(124,90,240,0.6)',
                            boxShadow: '0 0 10px rgba(124,90,240,0.3)',
                        }}
                    />
                    <div>
                        <div className="text-sm font-semibold leading-tight" style={{ color: '#f0effc' }}>
                            {fetchCurrentUser.name}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            {fetchCurrentUser.username}
                        </div>
                    </div>
                </div>
                <PlanBadge plan={fetchCurrentUser.plan} />
            </header>
        </>
    )
}

export default Navbar;