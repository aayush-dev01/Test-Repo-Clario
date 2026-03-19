import { createContext, useCallback, useContext, useRef, useState } from 'react';

const SessionGuardCtx = createContext(null);

// Wrap the app with this provider.
// SessionRoom calls setInSession(true) + setGuardHandler(fn) on mount.
// Sidebar calls attemptNavigate(url) instead of direct navigate.
export function SessionGuardProvider({ children }) {
  const [inSession, setInSession] = useState(false);
  const guardHandler = useRef(null); // fn(url) -> void called when nav is intercepted

  const setGuardHandler = useCallback(fn => { guardHandler.current = fn; }, []);

  const attemptNavigate = useCallback((url, navigateFn) => {
    if (inSession && guardHandler.current) {
      guardHandler.current(url); // triggers LeaveModal in SessionRoom
    } else {
      navigateFn(url);
    }
  }, [inSession]);

  return (
    <SessionGuardCtx.Provider value={{ inSession, setInSession, setGuardHandler, attemptNavigate }}>
      {children}
    </SessionGuardCtx.Provider>
  );
}

export function useSessionGuard() {
  const ctx = useContext(SessionGuardCtx);
  if (!ctx) throw new Error('useSessionGuard must be inside SessionGuardProvider');
  return ctx;
}
