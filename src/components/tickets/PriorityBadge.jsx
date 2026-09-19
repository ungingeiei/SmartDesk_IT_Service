import { PRIORITY_META } from '@/lib/data';
import Pill from '@/components/ui/Pill';

export default function PriorityBadge({ priority, className = '' }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return (
    <Pill colors={meta} className={`px-[13px] py-1.5 text-sm2 ${className}`}>
      {meta.label}
    </Pill>
  );
}
