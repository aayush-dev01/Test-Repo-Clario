import { createContext, useCallback, useContext, useState } from 'react';
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info', dur = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur);
  }, []);
  const toast = { success:(m,d)=>add(m,'success',d), error:(m,d)=>add(m,'error',d), info:(m,d)=>add(m,'info',d) };
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  const cls   = { success:'t-ok', error:'t-err', info:'t-info' };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${cls[t.type]}`}>
            <span style={{fontSize:16,flexShrink:0}}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
