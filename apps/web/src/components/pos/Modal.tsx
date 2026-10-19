'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  title, onClose, children, wide = false,
}: {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-aura-text/30 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[92vh] overflow-y-auto rounded-3xl bg-aura-surface shadow-premium`}>
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-aura-surface border-b border-aura-border print:hidden">
          <h2 className="font-serif text-xl">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 -me-2 rounded-full text-aura-muted hover:bg-aura-primary/50">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
