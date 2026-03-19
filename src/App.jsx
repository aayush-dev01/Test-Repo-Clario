import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { onAuthChange, getUserProfile } from './services/authService';
import { ToastProvider } from './context/ToastContext';
import { SessionGuardProvider } from './context/SessionGuardContext';
import Layout from './components/Layout';

// Pages
import Landing          from './pages/Landing';
import Login            from './pages/Login';
import Register         from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard   from './pages/TutorDashboard';
import FindSkills       from './pages/FindSkills';
import TutorProfile     from './pages/TutorProfile';
import TutorProfileEditor from './pages/TutorProfileEditor';
import TutorRequests    from './pages/TutorRequests';
import MySessions       from './pages/MySessions';
import SessionLobby     from './pages/SessionLobby';
import SessionRoom      from './pages/SessionRoom';
import SessionComplete  from './pages/SessionComplete';
import RateSession      from './pages/RateSession';
import Settings         from './pages/Settings';
import Analytics        from './pages/Analytics';
import NotFound         from './pages/NotFound';

// Loading screen
function Loader() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 42, height: 42, border: '2px solid rgba(0,229,255,0.13)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.45)', letterSpacing: '.05em' }}>CLARIO</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Auth-guarded route
function Require({ user, loading, children }) {
  if (loading) return <Loader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// Role-based dashboard redirect
function DashboardRedirect({ user, userProfile, loading }) {
  if (loading || !userProfile) return <Loader />;
  return <Navigate to={userProfile.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuthChange(async u => {
      setUser(u);
      if (u) {
        const profile = await getUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
  }, []);

  // Props passed to every authed page
  const pageProps = { user, userProfile, setUserProfile };

  return (
    <ToastProvider>
      <SessionGuardProvider>
      <Routes>
        {/* Public */}
        <Route path="/"         element={!authLoading && user ? <Navigate to={userProfile?.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'} replace /> : <Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected – inside Layout (sidebar) */}
        <Route element={
          <Require user={user} loading={authLoading}>
            <Layout user={user} userProfile={userProfile} />
          </Require>
        }>
          <Route path="/student/dashboard"  element={<StudentDashboard {...pageProps} />} />
          <Route path="/tutor/dashboard"    element={<TutorDashboard {...pageProps} />} />
          <Route path="/find-skills"        element={<FindSkills {...pageProps} />} />
          <Route path="/tutor/profile"      element={<TutorProfileEditor {...pageProps} />} />
          <Route path="/tutor/requests"     element={<TutorRequests {...pageProps} />} />
          <Route path="/tutor/:tutorId"     element={<TutorProfile {...pageProps} />} />
          <Route path="/my-sessions"        element={<MySessions {...pageProps} />} />
          <Route path="/session/lobby/:sessionId"    element={<SessionLobby {...pageProps} />} />
          <Route path="/session/room/:sessionId"     element={<SessionRoom {...pageProps} />} />
          <Route path="/session/complete/:sessionId" element={<SessionComplete {...pageProps} />} />
          <Route path="/session/rate/:sessionId"     element={<RateSession {...pageProps} />} />
          <Route path="/profile"            element={<Settings {...pageProps} />} />
          <Route path="/analytics"          element={<Analytics {...pageProps} />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SessionGuardProvider>
    </ToastProvider>
  );
}
