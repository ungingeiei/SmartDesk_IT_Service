'use client';

import { useApp } from '@/lib/store';

export default function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[26px] left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink
        px-5 py-2.5 text-base text-white shadow-soft"
    >
      {toastMsg}
    </div>
  );
}
