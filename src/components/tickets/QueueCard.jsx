'use client';

import TicketRow from './TicketRow';

/**
 * Queue row. Agents get a claim button on unassigned tickets; admins see a
 * read-only label instead, matching the design's role split.
 */
export default function QueueCard({ ticket, isAdmin, onClaim }) {
  let footer;
  if (ticket.assignee) {
    footer = <span className="text-ink-soft">ผู้ดูแล: {ticket.assignee.name}</span>;
  } else if (isAdmin) {
    footer = <span className="text-ink-soft">ยังไม่มอบหมาย</span>;
  } else {
    footer = (
      <button
        type="button"
        onClick={(e) => {
          // The whole row is a link; keep the claim from navigating.
          e.preventDefault();
          e.stopPropagation();
          onClaim(ticket.id);
        }}
        className="cursor-pointer rounded-full border-none bg-indigo px-3.5 py-[7px]
          text-sm font-bold text-white transition-colors hover:bg-indigo-dark"
      >
        รับเรื่องนี้
      </button>
    );
  }

  return (
    <TicketRow
      ticket={ticket}
      href={`/queue/${ticket.id}`}
      meta={
        <>
          <span>{ticket.cat}</span>
          <span>· แจ้งเมื่อ {ticket.created}</span>
        </>
      }
      footer={footer}
    />
  );
}
