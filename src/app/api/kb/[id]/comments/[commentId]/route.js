import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** "ทำเครื่องหมายว่าดีที่สุด" — exactly one accepted comment per article, like the mock did. */
export async function PATCH(req, { params }) {
  const { id, commentId } = await params;
  const { accepted } = await req.json();

  await prisma.$transaction([
    prisma.kb_comments.updateMany({
      where: { kb_id: Number(id) },
      data: { is_accepted: false },
    }),
    prisma.kb_comments.update({
      where: { id: Number(commentId) },
      data: { is_accepted: Boolean(accepted) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
