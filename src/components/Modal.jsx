import { useEffect } from 'react';

export default function Modal({ title, open, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-ink/70" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gold/30 bg-walnut p-5 shadow-table"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="modal-title" className="font-display text-2xl text-gold">
            {title}
          </h2>
          <button type="button" className="text-ink/70 hover:text-ink min-h-11 px-2" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 text-ink/85 text-sm leading-relaxed whitespace-pre-wrap">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap gap-2">{footer}</div>}
      </div>
    </div>
  );
}
