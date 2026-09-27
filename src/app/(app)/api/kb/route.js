import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, mapKbArticle } from '@/lib/serialize';

// คลังความรู้ (Knowledge Base) — shared by the employee and IT Support roles,
// and used both for the list page and (client-side) for the article detail
// page, self-service search on "แจ้งปัญหา", and the AI-suggestion guess.
//
// POST with a JSON body, not GET — mirrors the fetch() pattern already used
// by /api/auth/login (see src/components/auth/LoginForm.jsx). The body is
// reserved for future filters (category, search term); it is currently
// unused, so an empty `{}` is fine.
export async function POST(req) {
  await req.json().catch(() => ({}));
  return listArticles();
}

// GET — what store.jsx actually calls (`fetch('/api/kb')`) when loading the KB.
export async function GET() {
  return listArticles();
}

async function listArticles() {
  const rows = await prisma.kb_articles.findMany({
    include: KB_ARTICLE_INCLUDE,
    orderBy: { updated_at: 'desc' },
  });

  return NextResponse.json({ articles: rows.map(mapKbArticle) });
}

// PUT — "เพิ่มบทความใหม่" on the คลังความรู้ page. Body: { title, cat, step }.
// The compact add-article form only collects one step; adding steps 2+ later
// would need a follow-up "edit article" feature this project doesn't have yet.
export async function PUT(req) {
  const { title, cat, step } = await req.json().catch(() => ({}));

  if (!title?.trim() || !cat?.trim() || !step?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  const category = await prisma.categories.findUnique({ where: { name: cat } });
  if (!category) {
    return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้' }, { status: 400 });
  }

  const created = await prisma.kb_articles.create({
    data: {
      category_id: category.id,
      title: title.trim(),
      summary: step.trim().slice(0, 255),
      kb_steps: { create: [{ step_no: 1, content: step.trim() }] },
    },
    include: KB_ARTICLE_INCLUDE,
  });

  return NextResponse.json({ article: mapKbArticle(created) });
}
