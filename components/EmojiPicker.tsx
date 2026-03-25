'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬'],
  'Hearts':  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💘','💝','💟','♥️','❣️','💔','❤️‍🔥','❤️‍🩹'],
  'Hands':   ['👋','🤚','🖐️','✋','🖖','🤙','💪','🦾','🤝','🙌','👏','🤜','🤛','👊','✊','🤞','🤟','🤘','👌','🤏','👈','👉','👆','👇','☝️','👍','👎','✌️','🤞','🤙'],
  'People':  ['👤','👥','🧑','👦','👧','👨','👩','🧓','👴','👵','👶','🍼','🎅','🤶','🎃','👺','👻','💀','☠️','👽','🤖','💩'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗'],
  'Food':    ['🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🍔','🍟','🍕','🌮','🌯','🥗','🍜','🍣','🍦','🎂','🍰','🍩','🍪','☕','🧋','🍺','🥂'],
  'Sports':  ['⚽','🏀','🏈','⚾','🥎','🏐','🏉','🥏','🎾','🏸','🏒','🥊','🥋','🎯','⛳','🎱','🎮','🕹️','🏆','🥇','🥈','🥉','🏅','🎖️'],
  'Objects': ['🔥','💥','✨','⚡','❄️','🌊','💫','⭐','🌟','🎉','🎊','🎈','🎁','🎀','🪄','💎','🔑','🗝️','🔒','🔓','💡','📱','💻','⌚','📷','🎵','🎶','🎸'],
  'Symbols': ['✅','❌','⚠️','💯','‼️','⁉️','❓','❔','💤','🆕','🆙','🆒','🆓','🔝','📢','📣','🔔','🔕','🔇','🔈','🔉','🔊','📩','📨','📧','📬','📭'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('Smileys');

  const displayed = query.trim()
    ? ALL_EMOJIS.filter((e) => e.includes(query))
    : EMOJI_CATEGORIES[category] ?? [];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80 }} />
      <div style={{ position: 'fixed', bottom: 160, left: 16, right: 16, zIndex: 81, background: 'rgba(10,4,18,0.97)', borderRadius: 20, border: '1px solid rgba(198,255,51,0.12)', overflow: 'hidden', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
        {/* Search */}
        <div style={{ padding: '12px 12px 8px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji…"
            autoFocus
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '8px 12px 8px 32px', color: '#fff', fontSize: 13, outline: 'none' }}
          />
        </div>

        {/* Categories */}
        {!query && (
          <div style={{ display: 'flex', gap: 4, padding: '0 12px 8px', overflowX: 'auto' }}>
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 20, background: category === cat ? 'rgba(198,255,51,0.15)' : 'transparent', border: category === cat ? '1px solid rgba(198,255,51,0.35)' : '1px solid transparent', color: category === cat ? '#ff0066' : 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: '4px 12px 16px', maxHeight: 220, overflowY: 'auto' }}>
          {displayed.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              style={{ fontSize: 22, padding: 6, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', lineHeight: 1, transition: 'background 0.1s' }}
              onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
