'use client';

import { useEffect, useRef } from 'react';

/**
 * Dialog built on the native <dialog> element, so the browser supplies the focus
 * trap, Esc-to-close and inert background. Mount it only while it is open —
 * form state inside then resets on every open without any effect.
 */
export default function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      // A click that lands on the <dialog> itself (not its content) hit the backdrop.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-32px)] max-w-[520px] rounded-l border border-line bg-surface
        p-0 text-ink shadow-soft backdrop:bg-ink/40 ${className}`}
    >
      <div className="max-h-[calc(100vh-64px)] overflow-y-auto px-[30px] py-7 max-[600px]:px-[18px]">
        <h2 id="modal-title" className="mb-5 text-[20px] font-extrabold tracking-[-0.01em]">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
