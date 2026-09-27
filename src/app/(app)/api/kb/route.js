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

  // One line per step. A typed "1." / "2)" prefix is dropped because the
  // article page numbers the steps itself.
  const steps = step
    .split('\n')
    .map((line) => line.trim().replace(/^\d+\s*[.)]\s*/, ''))
    .filter(Boolean);

  const created = await prisma.kb_articles.create({
    data: {
      category_id: category.id,
      title: title.trim(),
      summary: steps[0].slice(0, 255),
      kb_steps: {
        create: steps.map((content, i) => ({ step_no: i + 1, content })),
      },
    },
    include: KB_ARTICLE_INCLUDE,
  });

  return NextResponse.json({ article: mapKbArticle(created) });
}
