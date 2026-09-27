import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TICKET_INCLUDE, mapTicket } from '@/lib/serialize';

// "ticket ของฉัน" (employee role) — every ticket the signed-in employee filed
// themselves. `reporterId` is the `id` the /api/auth/login response already
// carries, sent in the body (same pattern as the login request itself).
export async function POST(req) {
  const { reporterId } = await req.json().catch(() => ({}));

  if (!reporterId) {
    return NextResponse.json({ error: 'ต้องระบุ reporterId' }, { status: 400 });
  }

  const rows = await prisma.tickets.findMany({
    where: { reporter_id: Number(reporterId) },
    include: TICKET_INCLUDE,
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ tickets: rows.map(mapTicket) });
}
