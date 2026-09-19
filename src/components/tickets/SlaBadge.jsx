'use client';

import { slaInfo } from '@/lib/logic';
import { useNow } from '@/lib/useNow';
import Pill from '@/components/ui/Pill';

/**
 * SLA countdown.
 *
 * `useNow()` is null until the client mounts, so on the server render (and the
 * first paint) this reserves the row's height instead of printing a time that
 * would not match after hydration.
 */
export default function SlaBadge({ ticket, className = '' }) {
  const now = useNow();
  const sla = slaInfo(ticket, now);

  if (!sla) return <span className="inline-block h-[26px]" aria-hidden="true" />;

  return (
    <Pill colors={sla} className={`px-3 py-[5px] text-xs2 ${className}`}>
      {sla.label}
    </Pill>
  );
}
