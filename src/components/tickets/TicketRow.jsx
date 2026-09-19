import Link from 'next/link';
import PriorityBadge from './PriorityBadge';
import StatusPill from './StatusPill';
import SlaBadge from './SlaBadge';

/**
 * Shared row shell for the two ticket lists. `meta` is the line under the title
 * and `footer` is the optional third line the agent queue uses for assignment.
 */
export default function TicketRow({ ticket, href, meta, footer }) {
  return (
    <Link
      href={href}
      className="mb-2.5 block rounded-m border border-line bg-surface px-5 py-[18px]
        shadow-card transition hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-sm text-ink-faint">{ticket.id}</span>
        <span className="min-w-[160px] flex-1 text-lg font-bold">{ticket.title}</span>
        <PriorityBadge priority={ticket.priority} />
        <StatusPill status={ticket.status} />
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink-faint">
        {meta}
        <SlaBadge ticket={ticket} />
      </div>
      {footer ? <div className="mt-1.5 text-sm text-ink-faint">{footer}</div> : null}
    </Link>
  );
}
