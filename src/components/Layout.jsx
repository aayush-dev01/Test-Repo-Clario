import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { subscribePendingRequestsForTutor } from '../services/sessionService';

export default function Layout({ user, userProfile }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || userProfile?.role !== 'tutor') return;
    return subscribePendingRequestsForTutor(user.uid, reqs => setPendingCount(reqs.length));
  }, [user?.uid, userProfile?.role]);

  return (
    <div className="app-shell">
      <Sidebar user={user} userProfile={userProfile} pendingCount={pendingCount} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
