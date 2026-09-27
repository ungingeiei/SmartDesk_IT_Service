import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, mapKbArticle } from '@/lib/serialize';
import { findUser, isAdmin } from '@/lib/kbReview';

// PATCH /api/kb/:id — `id` is the numeric kb_articles.id (mapKbArticle's
// `id: String(row.id)`).
// Body: { action: 'addComment', authorName, text }
//     | { action: 'acceptComment', index }
//     | { action: 'approve' | 'reject', userId }   — หัวหน้าทีม IT only
//     | { action: 'view' }                        — returns { views } only
//
// Returns the whole article, freshly mapped, so the caller can just replace
// its copy of it — same shape every action leaves it in.
export async function PATCH(req, { params }) {
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'รหัสบทความไม่ถูกต้อง' }, { status: 400 });
  }

  if (body.action === 'view') {
    // Someone opened the article. Only published articles are counted, so a
    // reviewer reading a pending one doesn't inflate its numbers.
    const { count } = await prisma.kb_articles.updateMany({
      where: { id, status: 'approved' },
      data: { views: { increment: 1 } },
    });
    const row = await prisma.kb_articles.findUnique({ where: { id }, select: { views: true } });
    if (!row) {
      return NextResponse.json({ error: 'ไม่พบบทความนี้' }, { status: 404 });
    }
    return NextResponse.json({ views: row.views, counted: count > 0 });
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
  } else if (body.action === 'approve' || body.action === 'reject') {
    const reviewer = await findUser(body.userId);
    if (!isAdmin(reviewer)) {
      return NextResponse.json({ error: 'เฉพาะหัวหน้าทีม IT เท่านั้นที่อนุมัติบทความได้' }, { status: 403 });
    }
    const existing = await prisma.kb_articles.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบบทความนี้' }, { status: 404 });
    }
    const now = new Date();
    await prisma.kb_articles.update({
      where: { id },
      data: {
        status: body.action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: reviewer.id,
        reviewed_at: now,
        // Approval is when the article goes live, so it shows as freshly updated.
        ...(body.action === 'approve' ? { updated_at: now } : {}),
      },
    });
  } else {
    return NextResponse.json({ error: 'ไม่รู้จัก action นี้' }, { status: 400 });
  }

  const article = await prisma.kb_articles.findUnique({ where: { id }, include: KB_ARTICLE_INCLUDE });
  return NextResponse.json({ article: mapKbArticle(article) });
}

// DELETE /api/kb/:id — หัวหน้าทีม IT removes an article. Body: { userId }.
// The foreign keys are ON DELETE NO ACTION, so the article's child rows go
// first, and tickets that were pointed at it by the AI suggestion lose the link.
export async function DELETE(req, { params }) {
  const id = Number((await params).id);
  const { userId } = await req.json().catch(() => ({}));

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'รหัสบทความไม่ถูกต้อง' }, { status: 400 });
  }

  const requester = await findUser(userId);
  if (!isAdmin(requester)) {
    return NextResponse.json({ error: 'เฉพาะหัวหน้าทีม IT เท่านั้นที่ลบบทความได้' }, { status: 403 });
  }

  const existing = await prisma.kb_articles.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'ไม่พบบทความนี้' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.tickets.updateMany({
      where: { ai_suggested_kb_id: id },
      data: { ai_suggested_kb_id: null },
    }),
    prisma.kb_steps.deleteMany({ where: { kb_id: id } }),
    prisma.kb_article_tags.deleteMany({ where: { kb_id: id } }),
    prisma.kb_comments.deleteMany({ where: { kb_id: id } }),
    prisma.kb_feedback.deleteMany({ where: { kb_id: id } }),
    prisma.kb_deflections.deleteMany({ where: { kb_id: id } }),
    prisma.kb_articles.delete({ where: { id } }),
  ]);

  return NextResponse.json({ id: String(id) });
}
