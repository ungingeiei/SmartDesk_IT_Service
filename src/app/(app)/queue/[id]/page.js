'use client';

import { use, useState } from 'react';
import { useApp } from '@/lib/store';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import BackLink from '@/components/ui/BackLink';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PriorityBadge from '@/components/tickets/PriorityBadge';
import StatusPill from '@/components/tickets/StatusPill';
import SlaBadge from '@/components/tickets/SlaBadge';
import AssigneeRow from '@/components/tickets/AssigneeRow';
import TicketSection from '@/components/tickets/TicketSection';
import AgentControls from '@/components/tickets/AgentControls';
import ResolveForm from '@/components/tickets/ResolveForm';
import InternalNotes from '@/components/tickets/InternalNotes';
import ChatThread from '@/components/tickets/ChatThread';
import { FolderIcon } from '@/components/icons';

/** The IT team's workspace for one ticket. Admins see it read-only. */
export default function AgentTicketPage({ params }) {
  const { id } = use(params);
  const {
    tickets,
    currentUser,
    claimTicket,
    setTicketStatus,
    reopenTicket,
    resolveTicket,
    addInternalNote,
    sendChat,
  } = useApp();

  const [resolveOpen, setResolveOpen] = useState(false);

  const ticket = tickets.find((t) => t.id === id);

  if (!ticket) {
    return (
      <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
        <BackLink href="/queue">← กลับไปคิวงาน</BackLink>
        <EmptyState icon={<FolderIcon size={34} />} title="ไม่พบ ticket นี้" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isMine = ticket.assignee?.name === currentUser.name;
  const canClaim = !ticket.assignee && !isAdmin;
  const canWork = isMine && !isAdmin;

  function handleResolve(summary) {
    resolveTicket(ticket.id, currentUser, summary);
    setResolveOpen(false);
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <BackLink href="/queue">← กลับไปคิวงาน</BackLink>

      <Card>
        <div className="mb-1.5 flex flex-wrap items-start justify-between gap-3.5">
          <h2 className="m-0 text-[23px] font-extrabold">{ticket.title}</h2>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="mb-4 font-mono text-sm2 text-ink-faint">
          {ticket.id} · {ticket.created} · แจ้งโดย {ticket.reporter}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={ticket.status} />
          <SlaBadge ticket={ticket} />
          {ticket.reopenedCount > 0 ? (
            <Pill tone="critical" className="px-3 py-[5px] text-sm">
              เปิดใหม่ {ticket.reopenedCount} ครั้ง
            </Pill>
          ) : null}
        </div>

        <AssigneeRow assignee={ticket.assignee} pendingLabel="ยังไม่มอบหมายผู้ดูแล" />

        <TicketSection title="รายละเอียดที่แจ้ง">{ticket.desc}</TicketSection>

        {canClaim ? (
          <div className="my-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => claimTicket(ticket.id, currentUser, 'รับเรื่องนี้แล้ว')}
            >
              รับเรื่องนี้
            </Button>
          </div>
        ) : null}

        {canWork ? (
          <>
            <AgentControls
              status={ticket.status}
              onStatus={(status) => setTicketStatus(ticket.id, status)}
              onOpenResolve={() => setResolveOpen(true)}
              onReopen={() => reopenTicket(ticket.id)}
            />
            {resolveOpen ? (
              <ResolveForm onCancel={() => setResolveOpen(false)} onConfirm={handleResolve} />
            ) : null}
          </>
        ) : null}

        {ticket.resolutionSummary ? (
          <TicketSection title="สรุปวิธีแก้ไข">{ticket.resolutionSummary}</TicketSection>
        ) : null}

        {ticket.csat ? (
          <div className="my-4 text-center">
            <span className="text-base font-bold text-low">
              คะแนนความพึงพอใจจากผู้ใช้: {ticket.csat}/5 ดาว
            </span>
          </div>
        ) : null}

        <InternalNotes
          notes={ticket.internalNotes}
          canAdd={!isAdmin}
          onAdd={(txt) => addInternalNote(ticket.id, currentUser, txt)}
        />

        <ChatThread
          title="พูดคุยกับผู้แจ้ง"
          messages={ticket.chat}
          canSend={canWork}
          placeholder="พิมพ์ข้อความถึงผู้แจ้ง..."
          onSend={(txt) => sendChat(ticket.id, currentUser, txt, true)}
        />
      </Card>
    </div>
  );
}
