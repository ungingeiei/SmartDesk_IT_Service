import TicketRow from './TicketRow';

export default function MyTicketCard({ ticket }) {
  return (
    <TicketRow
      ticket={ticket}
      href={`/tickets/${ticket.id}`}
      meta={<span>แจ้งเมื่อ {ticket.created}</span>}
    />
  );
}
