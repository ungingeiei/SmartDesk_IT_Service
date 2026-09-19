'use client';

import { use } from 'react';
import { useApp } from '@/lib/store';
import Card from '@/components/ui/Card';
import BackLink from '@/components/ui/BackLink';
import EmptyState from '@/components/ui/EmptyState';
import PriorityBadge from '@/components/tickets/PriorityBadge';
import StatusPill from '@/components/tickets/StatusPill';
import SlaBadge from '@/components/tickets/SlaBadge';
import AssigneeRow from '@/components/tickets/AssigneeRow';
import StatusTracker from '@/components/tickets/StatusTracker';
import TicketSection from '@/components/tickets/TicketSection';
import ChatThread from '@/components/tickets/ChatThread';
import ConfirmFixedBox from '@/components/tickets/ConfirmFixedBox';
import CsatStars from '@/components/tickets/CsatStars';
import { FolderIcon } from '@/components/icons';

/** The reporter's view of their own ticket. */
export default function TicketDetailPage({ params }) {
  const { id } = use(params);
  const { tickets, kb, currentUser, sendChat, confirmFixedYes, confirmFixedNo, setCsat } = useApp();

  const ticket = tickets.find((t) => t.id === id);

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
        <BackLink href="/tickets">← กลับ</BackLink>
        <EmptyState icon={<FolderIcon size={34} />} title="ไม่พบ ticket นี้" />
      </div>
    );
  }

  const awaitingConfirmation = ticket.status === 'resolved' && !ticket.confirmed;
  const showCsat = ticket.status === 'closed' && ticket.confirmed;

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <BackLink href="/tickets">← กลับ</BackLink>

      <Card>
        <div className="mb-1.5 flex flex-wrap items-start justify-between gap-3.5">
          <h2 className="m-0 text-[23px] font-extrabold">{ticket.title}</h2>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="mb-4 font-mono text-sm2 text-ink-faint">
          {ticket.id} · {ticket.created}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={ticket.status} />
          <SlaBadge ticket={ticket} />
        </div>

        <AssigneeRow assignee={ticket.assignee} pendingLabel="รอมอบหมายให้เจ้าหน้าที่ IT" />

        <StatusTracker status={ticket.status} />

        <TicketSection title="รายละเอียดที่แจ้ง">{ticket.desc}</TicketSection>

        {awaitingConfirmation ? (
          <ConfirmFixedBox
            onYes={() => confirmFixedYes(ticket, kb)}
            onNo={() => confirmFixedNo(ticket.id)}
          />
        ) : null}

        {showCsat ? (
          <CsatStars value={ticket.csat} onRate={(n) => setCsat(ticket.id, n)} />
        ) : null}

        <ChatThread
          title="พูดคุยกับทีม IT"
          messages={ticket.chat}
          canSend
          viewerIsReporter
          placeholder="พิมพ์ข้อความ..."
          onSend={(txt) => sendChat(ticket.id, currentUser, txt, false)}
        />
      </Card>
    </div>
  );
}
