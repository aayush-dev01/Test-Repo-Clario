import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeNotifications, markNotificationRead, markAllRead } from '../services/notificationService';

const TYPE_ICON = {
  session_request:  '📬',
  session_accepted: '✅',
  session_rejected: '❌',
  session_started:  '📹',
  new_rating:       '⭐',
};

function timeAgo(ts) {
  if (!ts) return '';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ userId, collapsed }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen]     = useState(false);
  const wrapRef             = useRef(null);
  const navigate            = useNavigate();

  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, setNotifs);
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleClick = async (n) => {
    if (!n.read) await markNotificationRead(userId, n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    await markAllRead(userId);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Bell trigger button — same style as other nav links */}
      <button
        className="nav-lnk"
        style={{ width: '100%', textAlign: 'left' }}
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ''}`}
        title={`Notifications${unread > 0 ? ` (${unread})` : ''}`}
      >
        <span className="nav-ico">🔔</span>
        {!collapsed && (
          <span className="nav-lnk-label">
            Notifications{unread > 0 ? ` (${unread})` : ''}
          </span>
        )}
        {unread > 0 && (
          <span className="nav-bdg">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Panel — absolutely positioned to the right of the sidebar */}
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-header">
            <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifs.length === 0 ? (
              <div className="notif-empty">
                <span style={{ fontSize: 28 }}>🔕</span>
                <span>No notifications yet</span>
              </div>
            ) : (
              notifs.slice(0, 25).map(n => (
                <button
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-ico">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="notif-text">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
