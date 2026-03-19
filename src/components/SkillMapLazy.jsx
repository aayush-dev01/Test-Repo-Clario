import { lazy, Suspense } from 'react';
const SkillMap = lazy(() => import('./SkillMap'));
export default function SkillMapLazy(props) {
  return (
    <Suspense fallback={
      <div style={{ height: 400, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div className="spinner" />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading 3D skill map…</span>
      </div>
    }>
      <SkillMap {...props} />
    </Suspense>
  );
}
