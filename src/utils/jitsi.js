export function getJitsiDomain() {
  return import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
}

export function sanitizeJitsiRoomName(name) {
  return (name || '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100) || 'ClarioRoom';
}

export function getJitsiMeetingUrl(roomName, userDisplayName = 'Participant') {
  const safeRoom = sanitizeJitsiRoomName(roomName);
  const domain = getJitsiDomain();
  const params = new URLSearchParams({
    'config.prejoinPageEnabled': 'false',
    'config.disableDeepLinking': 'true',
    'userInfo.displayName': userDisplayName,
  });

  return `https://${domain}/${safeRoom}#${params.toString()}`;
}
