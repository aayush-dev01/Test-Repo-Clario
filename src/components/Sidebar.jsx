import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useSessionGuard } from '../context/SessionGuardContext';

const studentNav = [
  { to: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/find-skills', icon: '🔍', label: 'Find Tutors' },
  { to: '/my-sessions', icon: '🗓', label: 'My Sessions' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/profile', icon: '⚙️', label: 'Settings' },
];

const tutorNav = [
  { to: '/tutor/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/tutor/requests', icon: '📬', label: 'Requests', badge: true },
  { to: '/tutor/profile', icon: '✏️', label: 'Edit Profile' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/profile', icon: '⚙️', label: 'Settings' },
];

function initials(name = '') {
  return name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function NavTree({
  links,
  pendingCount,
  name,
  role,
  userId,
  pathname,
  onNavClick,
  collapsed,
  onToggleCollapse,
}) {
  return (
    <>
      <div className="sb-brand">
        <div className="sb-brand-main">
          <div className="sb-mark">C</div>
          <div className="sb-brand-text">
            <div className="sb-name">Clario</div>
            <div className="sb-tag">Peer learning</div>
          </div>
        </div>
        <button
          type="button"
          className="sb-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sb-nav">
        <div className="sb-grp-lbl">Navigation</div>
        {links.map((item) => {
          const isOn = pathname === item.to || (item.to !== '/' && pathname.startsWith(`${item.to}/`));
          const count = item.badge ? pendingCount : 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-lnk${isOn ? ' on' : ''}`}
              onClick={(event) => onNavClick(event, item.to)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-ico">{item.icon}</span>
              <span className="nav-lnk-label">{item.label}</span>
              {count > 0 && <span className="nav-bdg">{count}</span>}
            </Link>
          );
        })}

        <div className="sb-grp-lbl" style={{ marginTop: 16 }}>Account</div>
        <NotificationBell userId={userId} collapsed={collapsed} />
      </nav>

      <div className="sb-footer">
        <Link
          to="/profile"
          className="sb-user-row"
          onClick={(event) => onNavClick(event, '/profile')}
          title={collapsed ? name : undefined}
        >
          <div className="u-avatar">{initials(name)}</div>
          <div className="sb-user-info">
            <div
              className="u-name"
              style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {name}
            </div>
            <div className="u-role">{role}</div>
          </div>
        </Link>
      </div>
    </>
  );
}

export default function Sidebar({ user, userProfile, pendingCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('clario_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { attemptNavigate } = useSessionGuard();

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '92px' : '264px');
    try {
      localStorage.setItem('clario_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}

    return () => {
      document.documentElement.style.setProperty('--sidebar-w', '264px');
    };
  }, [collapsed]);

  const role = userProfile?.role || 'student';
  const links = role === 'tutor' ? tutorNav : studentNav;
  const name = userProfile?.displayName || user?.displayName || user?.email || 'User';

  const closeMobile = () => setMobileOpen(false);

  const handleNavClick = (event, to) => {
    event.preventDefault();
    attemptNavigate(to, navigate);
    closeMobile();
  };

  const treeProps = {
    links,
    pendingCount,
    name,
    role,
    userId: user?.uid,
    pathname: location.pathname,
    onNavClick: handleNavClick,
  };

  const mobileLinks = role === 'tutor'
    ? [
        { to: '/tutor/dashboard', ico: '🏠', lbl: 'Home' },
        { to: '/tutor/requests', ico: '📬', lbl: 'Requests', badge: true },
        { to: '/tutor/profile', ico: '✏️', lbl: 'Profile' },
        { to: '/profile', ico: '⚙️', lbl: 'Settings' },
      ]
    : [
        { to: '/student/dashboard', ico: '🏠', lbl: 'Home' },
        { to: '/find-skills', ico: '🔍', lbl: 'Discover' },
        { to: '/my-sessions', ico: '🗓', lbl: 'Sessions' },
        { to: '/profile', ico: '⚙️', lbl: 'Settings' },
      ];

  return (
    <>
      <aside className={`sidebar desktop-sidebar${collapsed ? ' collapsed' : ''}`}>
        <NavTree
          {...treeProps}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sb-mark">C</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>
            Clario
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendingCount > 0 && role === 'tutor' && <div className="nav-bdg">{pendingCount}</div>}
          <button className="ham-btn" onClick={() => setMobileOpen((value) => !value)} aria-label="Open menu">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <div className={`sb-overlay${mobileOpen ? ' open' : ''}`} onClick={closeMobile} />

      <aside
        className={`sidebar mobile-sidebar${mobileOpen ? ' open' : ''}`}
        style={{ display: 'none' }}
        ref={(element) => {
          if (element) element.style.display = 'flex';
        }}
      >
        <NavTree
          {...treeProps}
          collapsed={false}
          onToggleCollapse={closeMobile}
          onNavClick={(event, to) => {
            handleNavClick(event, to);
            closeMobile();
          }}
        />
      </aside>

      <nav className="bnav">
        {mobileLinks.map((item) => {
          const isOn = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
          const count = item.badge ? pendingCount : 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`bnav-item${isOn ? ' on' : ''}`}
              onClick={(event) => handleNavClick(event, item.to)}
            >
              <span className="bnav-ico">
                {item.ico}
                {count > 0 && <span className="bnav-dot" />}
              </span>
              <span>{item.lbl}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
