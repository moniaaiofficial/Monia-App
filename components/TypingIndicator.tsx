export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 6 }}>
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '18px 18px 18px 4px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(198,255,51,0.7)',
              display: 'inline-block',
              animation: `typingDot 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
