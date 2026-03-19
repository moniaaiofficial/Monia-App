'use client';

import { useRef } from 'react';
import {
  Camera, Image, FileText, MapPin, Mic, BarChart2, Link2, Smile, X,
} from 'lucide-react';

type Props = {
  onClose:           () => void;
  onCamera:          () => void;
  onGallery:         (files: FileList) => void;
  onDocument:        (files: FileList) => void;
  onLocation:        () => void;
  onVoice:           () => void;
  onPoll:            () => void;
  onEmoji:           () => void;
};

const items = [
  { icon: Camera,   label: 'Camera',    color: '#22c55e', key: 'camera'   },
  { icon: Image,    label: 'Gallery',   color: '#3b82f6', key: 'gallery'  },
  { icon: FileText, label: 'Document',  color: '#f59e0b', key: 'document' },
  { icon: MapPin,   label: 'Location',  color: '#ef4444', key: 'location' },
  { icon: Mic,      label: 'Voice',     color: '#a855f7', key: 'voice'    },
  { icon: BarChart2,label: 'Poll',      color: '#06b6d4', key: 'poll'     },
  { icon: Link2,    label: 'Link',      color: '#ec4899', key: 'link'     },
  { icon: Smile,    label: 'Emoji',     color: '#f97316', key: 'emoji'    },
] as const;

export default function AttachmentMenu({ onClose, onCamera, onGallery, onDocument, onLocation, onVoice, onPoll, onEmoji }: Props) {
  const galleryRef  = useRef<HTMLInputElement>(null);
  const docRef      = useRef<HTMLInputElement>(null);
  const cameraRef   = useRef<HTMLInputElement>(null);

  const handlers: Record<string, () => void> = {
    camera:   () => cameraRef.current?.click(),
    gallery:  () => galleryRef.current?.click(),
    document: () => docRef.current?.click(),
    location: onLocation,
    voice:    onVoice,
    poll:     onPoll,
    link:     onEmoji,
    emoji:    onEmoji,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 160, left: 16, right: 16, zIndex: 81,
          background: 'rgba(10,4,18,0.97)', borderRadius: 24,
          border: '1px solid rgba(198,255,51,0.12)',
          padding: '20px 16px 24px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Share</p>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {items.map(({ icon: Icon, label, color, key }) => (
            <button
              key={key}
              onClick={() => { handlers[key]?.(); if (key !== 'camera' && key !== 'gallery' && key !== 'document') onClose(); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${color}1a`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Hidden file inputs */}
        <input ref={cameraRef}  type="file" accept="image/*,video/*" capture="environment" style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.length) { onCamera(); onGallery(e.target.files); onClose(); } e.target.value = ''; }} />
        <input ref={galleryRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.length) { onGallery(e.target.files); onClose(); } e.target.value = ''; }} />
        <input ref={docRef}     type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv" multiple style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.length) { onDocument(e.target.files); onClose(); } e.target.value = ''; }} />
      </div>
    </>
  );
}
