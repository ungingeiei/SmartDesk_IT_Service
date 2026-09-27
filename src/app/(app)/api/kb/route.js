import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, mapKbArticle } from '@/lib/serialize';
import { findUser, isAdmin, visibleArticlesWhere } from '@/lib/kbReview';

// คลังความรู้ (Knowledge Base) — shared by the employee and IT Support roles,
// and used both for the list page and (client-side) for the article detail
// page, self-service search on "แจ้งปัญหา", and the AI-suggestion guess.
//
// Which articles come back depends on the viewer (see visibleArticlesWhere):
// approved ones for everybody, pending ones for an admin to review, and the
// viewer's own articles whatever their status.
//
// POST with a JSON body { viewerId }, not GET — mirrors the fetch() pattern
// already used by /api/auth/login (see src/components/auth/LoginForm.jsx).
export async function POST(req) {
  const { viewerId } = await req.json().catch(() => ({}));
  return listArticles(viewerId);
}

// GET — what store.jsx actually calls: /api/kb?viewerId=<id>
export async function GET(req) {
  return listArticles(req.nextUrl.searchParams.get('viewerId'));
}

async function listArticles(viewerId) {
  const viewer = await findUser(viewerId);

  const rows = await prisma.kb_articles.findMany({
    where: visibleArticlesWhere(viewer),
    include: KB_ARTICLE_INCLUDE,
    orderBy: { updated_at: 'desc' },
  });

  return NextResponse.json({ articles: rows.map(mapKbArticle) });
}

// PUT — "เพิ่มบทความใหม่" on the คลังความรู้ page. Body: { title, cat, step, userId }.
// An admin's article is published at once; anyone else's waits for approval.
export async function PUT(req) {
  const { title, cat, step, userId } = await req.json().catch(() => ({}));

  const author = await findUser(userId);
  if (!author) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนเพิ่มบทความ' }, { status: 401 });
  }

  // One line per step. A typed "1." / "2)" prefix is dropped because the
  // article page numbers the steps itself.
  const steps = (step ?? '')
    .split('\n')
    .map((line) => line.trim().replace(/^\d+\s*[.)]\s*/, ''))
    .filter(Boolean);

  if (!title?.trim() || !cat?.trim() || steps.length === 0) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  const category = await prisma.categories.findUnique({ where: { name: cat } });
  if (!category) {
    return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้' }, { status: 400 });
  }

  const publishNow = isAdmin(author);

  const created = await prisma.kb_articles.create({
    data: {
      category_id: category.id,
      title: title.trim(),
      summary: steps[0].slice(0, 255),
      status: publishNow ? 'approved' : 'pending',
      created_by: author.id,
      reviewed_by: publishNow ? author.id : null,
      reviewed_at: publishNow ? new Date() : null,
      kb_steps: {
        create: steps.map((content, i) => ({ step_no: i + 1, content })),
      },
    },
    include: KB_ARTICLE_INCLUDE,
  });

  return NextResponse.json({ article: mapKbArticle(created) });
}
