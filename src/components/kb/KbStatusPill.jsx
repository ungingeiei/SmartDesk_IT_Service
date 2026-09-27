import Pill from '@/components/ui/Pill';

const KB_STATUS_META = {
  pending: { label: 'รออนุมัติ', colors: { bg: 'var(--color-medium-soft)', color: 'var(--color-medium)' } },
  rejected: { label: 'ไม่อนุมัติ', colors: { bg: 'var(--color-critical-soft)', color: 'var(--color-critical)' } },
  approved: { label: 'เผยแพร่แล้ว', colors: { bg: 'var(--color-low-soft)', color: 'var(--color-low)' } },
};

/** Review state of a KB article: รออนุมัติ / ไม่อนุมัติ / เผยแพร่แล้ว. */
export default function KbStatusPill({ status, className = '' }) {
  const meta = KB_STATUS_META[status] ?? KB_STATUS_META.pending;
  return (
    <Pill colors={meta.colors} className={`px-2.5 py-1 text-xs ${className}`}>
      {meta.label}
    </Pill>
  );
}
