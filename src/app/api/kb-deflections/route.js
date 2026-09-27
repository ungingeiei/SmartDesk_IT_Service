import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** Total self-service deflections — feeds the dashboard's Deflection Rate stat. */
export async function GET() {
  const count = await prisma.kb_deflections.count();
  return NextResponse.json({ count });
}

/** Logged when someone opens a KB article from the ticket wizard's search step. */
export async function POST(req) {
  const { kbId, userId } = await req.json();

  await prisma.kb_deflections.create({
    data: {
      kb_id: kbId ? Number(kbId) : null,
      user_id: userId ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
