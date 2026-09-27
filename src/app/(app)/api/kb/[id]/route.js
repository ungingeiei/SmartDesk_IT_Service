import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, mapKbArticle } from '@/lib/serialize';

// PATCH /api/kb/:id — the article discussion thread (CommentList). `id` is
// the numeric kb_articles.id (mapKbArticle's `id: String(row.id)`).
// Body: { action: 'addComment', authorName, text }
//     | { action: 'acceptComment', index }
//
// Returns the whole article, freshly mapped, so the caller can just replace
// its copy of it — same shape either action leaves it in.
export async function PATCH(req, { params }) {
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'รหัสบทความไม่ถูกต้อง' }, { status: 400 });
  }

  if (body.action === 'addComment') {
    if (!body.authorName?.trim() || !body.text?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกความคิดเห็น' }, { status: 400 });
    }
    await prisma.kb_comments.create({
      data: { kb_id: id, author_name: body.authorName.trim(), comment: body.text.trim() },
    });
  } else if (body.action === 'acceptComment') {
    // `index` is a position in the same created_at-ascending order
    // mapKbArticle() sorts comments into on the client — not a DB id, so the
    // client never has to know one.
    const comments = await prisma.kb_comments.findMany({
      where: { kb_id: id },
      orderBy: { created_at: 'asc' },
    });
    const target = comments[body.index];
    if (!target) {
      return NextResponse.json({ error: 'ไม่พบความคิดเห็นนี้' }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.kb_comments.updateMany({ where: { kb_id: id }, data: { is_accepted: false } }),
      prisma.kb_comments.update({ where: { id: target.id }, data: { is_accepted: true } }),
    ]);
  } else {
    return NextResponse.json({ error: 'ไม่รู้จัก action นี้' }, { status: 400 });
  }

  const article = await prisma.kb_articles.findUnique({ where: { id }, include: KB_ARTICLE_INCLUDE });
  return NextResponse.json({ article: mapKbArticle(article) });
}
