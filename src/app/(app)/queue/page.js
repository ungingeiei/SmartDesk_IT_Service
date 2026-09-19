'use client';

import { useState } from 'react';
import { QUEUE_FILTERS } from '@/lib/data';
import { useApp } from '@/lib/store';
import PageHeading from '@/components/ui/PageHeading';
import EmptyState from '@/components/ui/EmptyState';
import QueueCard from '@/components/tickets/QueueCard';
import { FolderIcon } from '@/components/icons';

/** Sort order for the queue: most urgent first, then oldest first. */
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function QueuePage() {
  const { tickets, currentUser, claimTicket } = useApp();
  const [filter, setFilter] = useState('all');

  const isAdmin = currentUser.role === 'admin';

  const visible = tickets
    .filter((t) => {
      if (filter === 'unassigned') return !t.assignee;
      if (filter === 'mine') return t.assignee?.name === currentUser.name;
      if (filter === 'critical') return t.priority === 'critical' || t.priority === 'high';
      return true;
    })
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.createdAt - b.createdAt,
    );

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-[70px]">
      <PageHeading
        title={isAdmin ? 'ticket ทั้งหมด' : 'คิวงาน'}
        subtitle={`${visible.length} เรื่อง`}
      />

      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-2">
          {QUEUE_FILTERS.map((option) => (
            <button
              key={option.v}
              type="button"
              onClick={() => setFilter(option.v)}
              aria-pressed={filter === option.v}
              className={`cursor-pointer rounded-full border px-3.5 py-[7px] text-sm2 font-semibold
                transition-colors ${
                  filter === option.v
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-surface text-ink-soft hover:border-indigo'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {isAdmin ? (
          <span className="rounded-full bg-surface-alt px-3 py-[5px] text-xs2 text-ink-faint">
            มุมมองผู้ดูแล — อ่านอย่างเดียว
          </span>
        ) : null}
      </div>

      <div className="mt-2.5">
        {visible.length > 0 ? (
          visible.map((ticket) => (
            <QueueCard
              key={ticket.id}
              ticket={ticket}
              isAdmin={isAdmin}
              onClaim={(id) => claimTicket(id, currentUser)}
            />
          ))
        ) : (
          <EmptyState icon={<FolderIcon size={34} />} title="ไม่มี ticket ในตัวกรองนี้" />
        )}
      </div>
    </div>
  );
}
