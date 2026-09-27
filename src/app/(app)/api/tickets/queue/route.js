import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TICKET_INCLUDE, mapTicket } from '@/lib/serialize';

// "คิวงาน" (IT Support role) — every ticket in the system, newest first.
// The queue page itself applies the unassigned / mine / critical filters and
// the priority sort on the client, exactly as it did against the mock data.
// (Admins land on the same route for their read-only "ticket ทั้งหมด" view.)
export async function POST(req) {
  await req.json().catch(() => ({}));
  return listQueue();
}

// GET — what store.jsx actually calls (`fetch('/api/tickets/queue')`).
export async function GET() {
  return listQueue();
}

async function listQueue() {
  const rows = await prisma.tickets.findMany({
    include: TICKET_INCLUDE,
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ tickets: rows.map(mapTicket) });
}
