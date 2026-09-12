import { useEffect, useRef } from 'react';

export default function Log({ log = [] }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="bg-cream/80 border border-gold/25 rounded-2xl p-2.5 h-32 sm:h-36 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-ink/55">Island Log</p>
        <span className="text-[10px] text-ink/45 font-mono">{log.length} entries</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-ink/80 pr-1">
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
