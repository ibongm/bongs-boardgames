import { useEffect, useRef } from 'react';

export default function Log({ log = [] }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="bg-cream/70 border border-gold/25 rounded-2xl p-3 h-48 flex flex-col">
      <p className="text-xs uppercase tracking-wider font-semibold text-ink/55 mb-2">Island Log</p>
      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs text-ink/80 pr-1">
        {log.map((entry, idx) => (
          <p key={idx} className="leading-snug">
            <span className="text-ink/40 mr-1.5 font-mono">#{idx + 1}</span>
            {entry.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
