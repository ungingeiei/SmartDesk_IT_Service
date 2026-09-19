import { STATUS_META } from '@/lib/data';
import Pill from '@/components/ui/Pill';

export default function StatusPill({ status, className = '' }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <Pill colors={meta} className={`px-3 py-[5px] text-xs2 ${className}`}>
      {meta.label}
    </Pill>
  );
}
