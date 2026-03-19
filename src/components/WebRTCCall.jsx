import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db, serverTimestamp } from '../services/firebase';
import { motion } from 'framer-motion';

const RTC_CONFIG = { iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}] };

async function clearCol(ref) {
  const snap = await getDocs(ref);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

async function resetSignaling(sessionId) {
  const callRef  = doc(db,'sessions',sessionId,'calls','demo');
  const offCands = collection(db,'sessions',sessionId,'calls','demo','offerCandidates');
  const ansCands = collection(db,'sessions',sessionId,'calls','demo','answerCandidates');
  await Promise.all([clearCol(offCands),clearCol(ansCands)]);
  await deleteDoc(callRef).catch(()=>{});
  return { callRef, offCands, ansCands };
}

const STATUS = {
  'requesting-media':    'Requesting camera & mic…',
  'waiting-peer-tutor':  'Waiting for the student to join…',
  'waiting-peer-student':'Waiting for the tutor to start…',
  'connecting':          'Connecting peer-to-peer…',
  'connected':           'Live — peer-to-peer connected',
  'error':               'Connection problem',
};

export default function WebRTCCall({ sessionId, userId, isTutor, userDisplayName, onLeave }) {
  const localRef        = useRef(null);
  const remoteRef       = useRef(null);
  const pcRef           = useRef(null);
  const localStreamRef  = useRef(null);
  const remoteStreamRef = useRef(null);
  const answerCreated   = useRef(false);
  const pendingCands    = useRef([]);

  const [status, setStatus] = useState('requesting-media');
  const [errMsg, setErrMsg] = useState('');
  const [mic, setMic]       = useState(true);
  const [cam, setCam]       = useState(true);
  const [pipExpanded, setPipExpanded] = useState(false); // let user tap PiP to enlarge

  // ── WebRTC setup (unchanged logic) ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !userId) return;
    let cancelled  = false;
    let unsubCall  = ()=>{};
    let unsubCands = ()=>{};

    const flush = async () => {
      const pc = pcRef.current;
      if (!pc?.remoteDescription) return;
      while (pendingCands.current.length) {
        await pc.addIceCandidate(pendingCands.current.shift()).catch(()=>{});
      }
    };

    const queueOrAdd = async cInit => {
      const pc = pcRef.current;
      if (!pc) return;
      const c = new RTCIceCandidate(cInit);
      if (pc.remoteDescription) { await pc.addIceCandidate(c).catch(()=>{}); return; }
      pendingCands.current.push(c);
    };

    const setup = async () => {
      try {
        setStatus('requesting-media');
        setErrMsg('');
        answerCreated.current = false;
        pendingCands.current  = [];

        const ls = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode:'user', width:{ideal:1280}, height:{ideal:720} },
        });
        if (cancelled) { ls.getTracks().forEach(t=>t.stop()); return; }
        localStreamRef.current = ls;
        if (localRef.current) localRef.current.srcObject = ls;

        const rs = new MediaStream();
        remoteStreamRef.current = rs;
        if (remoteRef.current) remoteRef.current.srcObject = rs;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        ls.getTracks().forEach(t => pc.addTrack(t, ls));

        pc.ontrack = e => {
          e.streams[0].getTracks().forEach(t => rs.addTrack(t));
          setStatus('connected');
        };
        pc.oniceconnectionstatechange = () => {
          const s = pc.iceConnectionState;
          if (s==='failed'||s==='disconnected') {
            setErrMsg('Connection failed. Try the same Wi-Fi or a hotspot.');
            setStatus('error');
          } else if (s==='checking') {
            setStatus('connecting');
          } else if (s==='connected'||s==='completed') {
            setStatus('connected');
          }
        };

        let refs;
        if (isTutor) {
          refs = await resetSignaling(sessionId);
          pc.onicecandidate = async e => {
            if (e.candidate) await addDoc(refs.offCands, e.candidate.toJSON());
          };
          unsubCall = onSnapshot(refs.callRef, async snap => {
            if (!snap.exists()) return;
            if (snap.data()?.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(snap.data().answer));
              await flush();
              setStatus('connecting');
            }
          });
          unsubCands = onSnapshot(refs.ansCands, snap =>
            snap.docChanges().forEach(c => { if (c.type==='added') queueOrAdd(c.doc.data()); })
          );
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await setDoc(refs.callRef, {
            createdAt: serverTimestamp(),
            hostId: userId,
            hostName: userDisplayName||'Tutor',
            offer: { sdp:offer.sdp, type:offer.type },
            updatedAt: serverTimestamp(),
          });
          setStatus('waiting-peer-tutor');
        } else {
          refs = {
            callRef:  doc(db,'sessions',sessionId,'calls','demo'),
            offCands: collection(db,'sessions',sessionId,'calls','demo','offerCandidates'),
            ansCands: collection(db,'sessions',sessionId,'calls','demo','answerCandidates'),
          };
          pc.onicecandidate = async e => {
            if (e.candidate) await addDoc(refs.ansCands, e.candidate.toJSON());
          };
          unsubCall = onSnapshot(refs.callRef, async snap => {
            if (!snap.exists()||!snap.data()?.offer) { setStatus('waiting-peer-student'); return; }
            if (!pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(snap.data().offer));
              await flush();
            }
            if (!answerCreated.current) {
              const ans = await pc.createAnswer();
              await pc.setLocalDescription(ans);
              await setDoc(refs.callRef, {
                answer: { sdp:ans.sdp, type:ans.type },
                guestId: userId,
                guestName: userDisplayName||'Student',
                updatedAt: serverTimestamp(),
              }, { merge:true });
              answerCreated.current = true;
              setStatus('connecting');
            }
          });
          unsubCands = onSnapshot(refs.offCands, snap =>
            snap.docChanges().forEach(c => { if (c.type==='added') queueOrAdd(c.doc.data()); })
          );
        }
      } catch(e) {
        if (cancelled) return;
        setErrMsg(e?.message||'Unable to access camera/mic.');
        setStatus('error');
      }
    };

    setup();
    return () => {
      cancelled = true;
      unsubCall();
      unsubCands();
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [sessionId, userId, isTutor, userDisplayName]);

  const toggleTrack = kind => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = kind==='audio' ? !mic : !cam;
    stream.getTracks().forEach(t => { if (t.kind===kind) t.enabled=next; });
    if (kind==='audio') setMic(next); else setCam(next);
  };

  const statusTxt = STATUS[status] || (isTutor ? STATUS['waiting-peer-tutor'] : STATUS['waiting-peer-student']);
  const isLive    = status === 'connected';

  return (
    <div className="vc-root">

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      <div className="vc-status-bar">
        {isLive
          ? <div className="live-dot" />
          : <div className="spinner spinner-sm" />
        }
        <span style={{ fontSize:13.5, color: isLive ? 'var(--success)' : 'rgba(255,255,255,0.55)' }}>
          {statusTxt}
        </span>
      </div>

      {/* ── Main video stage ─────────────────────────────────────────────────── */}
      <div className="vc-stage">

        {/* Remote — fills entire stage */}
        <div className="vc-remote">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', background:'#000' }}
          />

          {/* Waiting overlay on remote tile */}
          {!isLive && (
            <div className="vid-overlay">
              <div className="spinner" style={{ width:48, height:48 }} />
              <span style={{ fontSize:12, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(0,212,255,0.75)', marginTop:8 }}>
                {statusTxt}
              </span>
            </div>
          )}

          {/* Remote label */}
          <div className="vc-label vc-label-tl">
            {isLive ? (isTutor ? 'Student' : 'Tutor') : 'Remote'}
          </div>
        </div>

        {/* Local — PiP tile, bottom-right corner */}
        <div
          className={`vc-pip${pipExpanded ? ' expanded' : ''}`}
          onClick={() => setPipExpanded(v => !v)}
          title="Click to resize"
        >
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', background:'#111' }}
          />
          {!cam && (
            <div className="vid-overlay" style={{ background:'rgba(10,15,30,0.92)' }}>
              <span style={{ fontSize:22 }}>📷</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>Camera off</span>
            </div>
          )}
          <div className="vc-label vc-label-bl">You</div>
          {/* Resize hint icon */}
          <div className="vc-pip-hint">{pipExpanded ? '⊙' : '⊕'}</div>
        </div>

        {/* ── Floating control bar ─────────────────────────────────────────── */}
        <div className="vc-controls">
          <motion.button
            whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
            className={`ctrl-btn${!mic ? ' muted' : ''}`}
            onClick={() => toggleTrack('audio')}
            title={mic ? 'Mute' : 'Unmute'}
          >
            {mic ? '🎙' : '🔇'}
          </motion.button>

          <motion.button
            whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
            className={`ctrl-btn${!cam ? ' muted' : ''}`}
            onClick={() => toggleTrack('video')}
            title={cam ? 'Hide camera' : 'Show camera'}
          >
            {cam ? '📹' : '🚫'}
          </motion.button>

          <motion.button
            whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
            className="ctrl-btn red"
            onClick={onLeave}
            title="Leave room"
          >
            📵
          </motion.button>
        </div>
      </div>

      {/* Error message */}
      {errMsg && (
        <div className="vc-error">
          ⚠ {errMsg}
        </div>
      )}
    </div>
  );
}
