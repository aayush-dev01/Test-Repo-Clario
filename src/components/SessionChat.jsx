import { useEffect, useRef, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
];
const ALLOWED_EXT  = ['.pdf','.doc','.docx','.ppt','.pptx','.txt','.png','.jpg','.jpeg','.gif','.webp'];
const MAX_SIZE_MB  = 10;

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fileIcon(mime = '') {
  if (mime.startsWith('image/'))     return '🖼️';
  if (mime.includes('pdf'))          return '📄';
  if (mime.includes('word'))         return '📝';
  if (mime.includes('presentation')) return '📊';
  if (mime.includes('text'))         return '📃';
  return '📎';
}

function FileMessage({ msg, isMine }) {
  return (
    <a
      href={msg.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`chat-file-bubble${isMine ? ' mine' : ''}`}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(msg.fileMime)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {msg.fileName}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          {msg.fileSize ? `${(msg.fileSize / 1024 / 1024).toFixed(1)} MB` : ''} · click to open
        </div>
      </div>
    </a>
  );
}

export default function SessionChat({ sessionId, userId, displayName }) {
  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [sending, setSending]               = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
  const [uploadError, setUploadError]       = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);

  // Subscribe to chat messages
  useEffect(() => {
    if (!sessionId) return;
    const q = query(
      collection(db, 'sessions', sessionId, 'chat'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [sessionId]);

  // Auto-scroll to latest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send text message ──────────────────────────────────────────────────────
  const sendMessage = async (extra = {}) => {
    const trimmed = text.trim();
    if (!trimmed && !extra.fileUrl) return;
    setSending(true);
    const savedText = trimmed;
    setText('');
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'chat'), {
        senderId:   userId,
        senderName: displayName || 'User',
        text:       trimmed,
        createdAt:  serverTimestamp(),
        ...extra,
      });
    } catch (err) {
      console.error('Chat send failed:', err);
      if (!extra.fileUrl) setText(savedText); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = e => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-selected
    if (!file) return;

    setUploadError('');
    setUploadFileName('');

    // Validate type
    const typeOk = ALLOWED_TYPES.includes(file.type) ||
      ALLOWED_EXT.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!typeOk) {
      setUploadError('File type not supported. Allowed: PDF, DOC, DOCX, PPT, TXT, PNG, JPG, GIF, WEBP');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    // Sanitise filename — remove special chars that break Storage paths
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path     = `sessions/${sessionId}/chat/${Date.now()}_${safeName}`;
    const ref      = storageRef(storage, path);

    setUploadFileName(file.name);
    setUploadProgress(0);

    const task = uploadBytesResumable(ref, file, {
      contentType: file.type || 'application/octet-stream',
    });

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(pct);
      },
      error => {
        console.error('Storage upload error:', error.code, error.message);
        setUploadProgress(null);
        setUploadFileName('');

        // Give a human-readable error based on Firebase Storage error codes
        const msg = {
          'storage/unauthorized':   'Upload permission denied. Make sure Firebase Storage rules allow writes.',
          'storage/canceled':       'Upload was cancelled.',
          'storage/quota-exceeded': 'Firebase Storage quota exceeded.',
          'storage/invalid-url':    'Invalid storage bucket URL. Check VITE_FIREBASE_STORAGE_BUCKET in .env',
          'storage/retry-limit-exceeded': 'Upload timed out. Check your internet connection.',
        }[error.code] || `Upload failed: ${error.message}`;

        setUploadError(msg);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploadProgress(null);
          setUploadFileName('');
          await sendMessage({
            fileUrl:  url,
            fileName: file.name,
            fileMime: file.type || 'application/octet-stream',
            fileSize: file.size,
          });
        } catch (err) {
          console.error('getDownloadURL failed:', err);
          setUploadError('File uploaded but could not get download link. Try again.');
          setUploadProgress(null);
          setUploadFileName('');
        }
      },
    );
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="chat-panel">
      {/* Messages */}
      <div className="chat-msgs">
        {messages.length === 0 && (
          <div className="chat-empty">
            <span style={{ fontSize: 28 }}>💬</span>
            <span>No messages yet. Say hello!</span>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.senderId === userId;
          return (
            <div key={msg.id} className={`chat-msg${isMine ? ' mine' : ''}`}>
              {!isMine && <div className="chat-sender">{msg.senderName}</div>}
              {msg.fileUrl
                ? <FileMessage msg={msg} isMine={isMine} />
                : <div className="chat-bubble">{msg.text}</div>
              }
              {/* Show caption text if file has accompanying text */}
              {msg.fileUrl && msg.text && (
                <div className="chat-bubble" style={{ marginTop: 4 }}>{msg.text}</div>
              )}
              <div className="chat-time">{formatTime(msg.createdAt)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <div className="chat-upload-bar">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
              📎 {uploadFileName}
            </span>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>
              {uploadProgress}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, var(--primary), var(--success))',
              width: `${uploadProgress}%`,
              transition: 'width .15s',
            }} />
          </div>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="chat-upload-error">
          <span>⚠ {uploadError}</span>
          <button
            onClick={() => setUploadError('')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 0 0 8px', opacity: 0.7 }}
          >✕</button>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        <input
          ref={fileRef}
          type="file"
          style={{ display: 'none' }}
          accept={ALLOWED_EXT.join(',')}
          onChange={handleFile}
        />
        <button
          className="chat-attach-btn"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          title={`Attach file — ${ALLOWED_EXT.join(', ')} — max ${MAX_SIZE_MB} MB`}
          aria-label="Attach file"
        >
          {isUploading ? (
            <div className="spinner spinner-sm" style={{ width: 16, height: 16 }} />
          ) : '📎'}
        </button>
        <input
          ref={inputRef}
          className="form-inp chat-inp"
          type="text"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          maxLength={1000}
          disabled={sending}
          autoComplete="off"
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={() => sendMessage()}
          disabled={!text.trim() || sending}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
