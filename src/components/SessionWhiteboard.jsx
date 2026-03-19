import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLORS   = ['#00e5ff', '#3fe0c5', '#ff6b6b', '#7c6fff', '#ffffff', '#ffd166'];
const SIZES    = [2, 4, 8, 14];
const DEBOUNCE = 120;

export default function SessionWhiteboard({ sessionId, userId, isTutor }) {
  const canvasRef    = useRef(null);
  const ctxRef       = useRef(null);
  const drawing      = useRef(false);
  const lastPt       = useRef(null);
  const localStrokes = useRef([]);
  const syncTimer    = useRef(null);

  const [color, setColor]     = useState(COLORS[0]);
  const [size, setSize]       = useState(SIZES[1]);
  const [tool, setTool]       = useState('pen');
  // Access control state — tutor controls whether student can draw
  const [studentAllowed, setStudentAllowed] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);

  const canDraw = isTutor || studentAllowed;

  // ── Canvas helpers ──────────────────────────────────────────────────────────
  const getCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    return ctx;
  };

  const redraw = useCallback((strokes) => {
    const canvas = canvasRef.current;
    const ctx    = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#060d1b' : stroke.color;
      ctx.lineWidth   = stroke.size;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  // ── Firestore sync — strokes ────────────────────────────────────────────────
  const scheduleSync = useCallback(() => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (!sessionId) return;
      try {
        await setDoc(doc(db, 'sessions', sessionId, 'whiteboard', 'state'), {
          strokes:   localStrokes.current,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      } catch (err) { console.error('Whiteboard sync:', err); }
    }, DEBOUNCE);
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(doc(db, 'sessions', sessionId, 'whiteboard', 'state'), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.updatedBy === userId) return; // skip own push
      localStrokes.current = data.strokes || [];
      redraw(localStrokes.current);
    });
  }, [sessionId, userId, redraw]);

  // ── Firestore sync — access control ────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(doc(db, 'sessions', sessionId, 'whiteboard', 'control'), snap => {
      if (!snap.exists()) { setStudentAllowed(false); return; }
      setStudentAllowed(snap.data().studentAllowed === true);
    });
  }, [sessionId]);

  const toggleStudentAccess = async () => {
    setTogglingAccess(true);
    try {
      await setDoc(doc(db, 'sessions', sessionId, 'whiteboard', 'control'), {
        studentAllowed: !studentAllowed,
        updatedAt:      serverTimestamp(),
      });
    } catch (err) { console.error('Access control:', err); }
    finally { setTogglingAccess(false); }
  };

  // ── Canvas resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const strokes = [...localStrokes.current];
      canvas.width  = width  || 700;
      canvas.height = height || 440;
      ctxRef.current = null;
      redraw(strokes);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  // ── Pointer events ──────────────────────────────────────────────────────────
  const getPos = e => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left)  * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)   * (canvas.height / rect.height),
    };
  };

  const startStroke = e => {
    if (!canDraw) return;
    e.preventDefault();
    drawing.current = true;
    const pt = getPos(e);
    lastPt.current = pt;
    localStrokes.current.push({
      color: tool === 'eraser' ? '#060d1b' : color,
      size:  tool === 'eraser' ? size * 3  : size,
      tool,
      points: [pt],
    });
  };

  const continueStroke = e => {
    if (!canDraw || !drawing.current) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pt  = getPos(e);
    const cur = localStrokes.current[localStrokes.current.length - 1];
    if (!cur) return;
    cur.points.push(pt);
    ctx.beginPath();
    ctx.strokeStyle = cur.tool === 'eraser' ? '#060d1b' : cur.color;
    ctx.lineWidth   = cur.size;
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPt.current = pt;
    scheduleSync();
  };

  const endStroke = e => {
    e?.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    scheduleSync();
  };

  const clearBoard = async () => {
    localStrokes.current = [];
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!sessionId) return;
    try {
      await setDoc(doc(db, 'sessions', sessionId, 'whiteboard', 'state'), {
        strokes: [], updatedAt: serverTimestamp(), updatedBy: userId,
      });
    } catch (err) { console.error('Clear whiteboard:', err); }
  };

  return (
    <div className="wb-panel">
      {/* Toolbar */}
      <div className="wb-toolbar">
        {/* Tutor access control toggle */}
        {isTutor && (
          <div className="wb-access-toggle">
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginRight:8 }}>Student draw:</span>
            <button
              className={`wb-access-btn${studentAllowed ? ' allowed' : ''}`}
              onClick={toggleStudentAccess}
              disabled={togglingAccess}
              title={studentAllowed ? 'Click to revoke student drawing access' : 'Click to allow student to draw'}
            >
              {togglingAccess ? '…' : studentAllowed ? '🔓 Allowed' : '🔒 Locked'}
            </button>
          </div>
        )}

        {/* Student locked notice */}
        {!isTutor && !studentAllowed && (
          <div style={{ fontSize:12, color:'rgba(255,200,50,0.8)', display:'flex', alignItems:'center', gap:6 }}>
            🔒 Tutor hasn't enabled drawing yet
          </div>
        )}

        {canDraw && (
          <>
            <div className="wb-tool-group">
              <button className={`wb-tool-btn${tool==='pen'?' active':''}`} onClick={()=>setTool('pen')} title="Pen">✏️</button>
              <button className={`wb-tool-btn${tool==='eraser'?' active':''}`} onClick={()=>setTool('eraser')} title="Eraser">🧹</button>
            </div>
            <div className="wb-tool-group">
              {COLORS.map(c => (
                <button key={c} className={`wb-color-btn${color===c&&tool==='pen'?' active':''}`}
                  style={{ background:c }} onClick={()=>{setColor(c);setTool('pen');}} title={c}/>
              ))}
            </div>
            <div className="wb-tool-group">
              {SIZES.map(s => (
                <button key={s} className={`wb-size-btn${size===s?' active':''}`} onClick={()=>setSize(s)}>
                  <span style={{ width:Math.max(s,3), height:Math.max(s,3), borderRadius:'50%', background:tool==='pen'?color:'rgba(255,255,255,0.5)', display:'block' }}/>
                </button>
              ))}
            </div>
          </>
        )}

        {(isTutor || canDraw) && (
          <button className="wb-clear-btn btn btn-secondary btn-sm" onClick={clearBoard} title="Clear board for everyone">
            🗑 Clear
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="wb-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          style={{ cursor: !canDraw ? 'not-allowed' : tool==='eraser' ? 'cell' : 'crosshair' }}
          onMouseDown={startStroke}
          onMouseMove={continueStroke}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={startStroke}
          onTouchMove={continueStroke}
          onTouchEnd={endStroke}
        />
        {!canDraw && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(10,15,30,0.55)', backdropFilter:'blur(2px)', pointerEvents:'none' }}>
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
              Waiting for tutor to enable drawing
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
