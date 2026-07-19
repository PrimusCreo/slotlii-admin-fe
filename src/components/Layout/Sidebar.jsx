import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Users,
  RadioTower,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clinics', label: 'Clinics', icon: Building2 },
  { path: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/api-status', label: 'API Status', icon: RadioTower },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Slotlii</h1>
        <span>Admin Panel</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <span className="sidebar-user-name">{user.username}</span>
          </div>
        )}
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
