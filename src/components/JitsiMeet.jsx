import { useEffect, useRef, useState } from 'react';
import { getJitsiDomain, sanitizeJitsiRoomName } from '../utils/jitsi';


export default function JitsiMeet({ roomName, userDisplayName, onEnd }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const timeoutRef = useRef(null);
  const [callState, setCallState] = useState('connecting');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !roomName) return undefined;

    const safeRoom = sanitizeJitsiRoomName(roomName);
    let cancelled = false;

    const clearPendingTimeout = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const boot = () => {
      if (cancelled) return;

      if (typeof window.JitsiMeetExternalAPI === 'undefined') {
        timeoutRef.current = window.setTimeout(boot, 200);
        return;
      }

      try {
        setCallState('connecting');
        setError(null);

        const api = new window.JitsiMeetExternalAPI(getJitsiDomain(), {
          roomName: safeRoom,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'hangup',
              'chat',
              'participants-pane',
              'settings',
              'tileview',
            ],
          },
          userInfo: {
            displayName: userDisplayName || 'Participant',
          },
        });

        api.addEventListener('videoConferenceJoined', () => {
          setCallState('connected');
          setError(null);
        });

        api.addEventListener('videoConferenceLeft', () => {
          onEnd?.();
        });

        api.addEventListener('readyToClose', () => {
          onEnd?.();
        });

        api.addEventListener('cameraError', () => {
          setError('Camera access was blocked. Check browser permissions and reload.');
        });

        api.addEventListener('micError', () => {
          setError('Microphone access was blocked. Check browser permissions and reload.');
        });

        apiRef.current = api;
      } catch {
        setError('Failed to start the video call. Please try again.');
        setCallState('error');
      }
    };

    boot();

    return () => {
      cancelled = true;
      clearPendingTimeout();
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, userDisplayName, onEnd]);

  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#06101e]">
      {callState !== 'connected' && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#06101e]/90 backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
            <p className="mt-4 text-sm uppercase tracking-[0.28em] text-cyan/75">Connecting call</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-coral/30 bg-coral/15 px-4 py-2 text-sm text-coral backdrop-blur-md">
          {error}
        </div>
      )}

      <div ref={containerRef} className="h-[72vh] min-h-[460px] w-full" />
    </div>
  );
}
