import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCommentDTO } from '@/lib/kbDto';

/** The KB article page's comment composer. */
export async function POST(req, { params }) {
  const { id } = await params;
  const { userId, authorName, comment } = await req.json();

  if (!comment?.trim() || !authorName?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกความคิดเห็น' }, { status: 400 });
  }

  const created = await prisma.kb_comments.create({
    data: {
      kb_id: Number(id),
      author_id: userId ?? null,
      author_name: authorName,
      comment: comment.trim(),
    },
  });

  return NextResponse.json(toCommentDTO(created), { status: 201 });
}
