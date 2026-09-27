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

  const rows = await prisma.kb_articles.findMany({
    include: KB_ARTICLE_INCLUDE,
    orderBy: { updated_at: 'desc' },
  });

  return NextResponse.json({ articles: rows.map(mapKbArticle) });
}
