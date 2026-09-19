'use client';

import { useApp } from '@/lib/store';
import PageHeading from '@/components/ui/PageHeading';
import EmptyState from '@/components/ui/EmptyState';
import MyTicketCard from '@/components/tickets/MyTicketCard';
import { FolderIcon } from '@/components/icons';

export default function MyTicketsPage() {
  const { tickets, currentUser } = useApp();
  const myTickets = tickets.filter((t) => t.reporter === currentUser.name);

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <PageHeading title="ticket ของฉัน" subtitle={`${myTickets.length} เรื่อง`} size="lg" />

      {myTickets.length > 0 ? (
        <div className="mt-2.5">
          {myTickets.map((ticket) => (
            <MyTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-2.5"
          icon={<FolderIcon size={34} />}
          title="ยังไม่มีเรื่องที่แจ้งไว้"
          hint="เมื่อคุณแจ้งปัญหา จะเห็นสถานะความคืบหน้าที่นี่"
        />
      )}
    </div>
  );
}
