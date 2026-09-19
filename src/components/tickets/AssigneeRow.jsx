import { initialOf } from '@/lib/logic';
import Avatar from '@/components/ui/Avatar';

/** Who owns the ticket, or a muted line when nobody does yet. */
export default function AssigneeRow({ assignee, pendingLabel }) {
  if (!assignee) {
    return (
      <div className="mb-[22px] rounded-m bg-surface-alt px-3.5 py-2.5 text-sm2 font-semibold text-ink-faint">
        {pendingLabel}
      </div>
    );
  }

  return (
    <div className="mb-[22px] flex items-center gap-2.5 rounded-m bg-surface-alt px-3.5 py-2.5">
      <Avatar initial={initialOf(assignee.name)} size={34} />
      <div className="flex flex-col leading-[1.35]">
        <span className="text-xs text-ink-faint">ผู้ดูแลเรื่องนี้</span>
        <span className="text-base font-bold text-ink">
          {assignee.name}{' '}
          <span className="font-mono text-xs text-ink-faint">· {assignee.code}</span>
        </span>
      </div>
    </div>
  );
}
