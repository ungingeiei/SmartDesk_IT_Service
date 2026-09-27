import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, toKbDTO } from '@/lib/kbDto';

export async function GET() {
  const articles = await prisma.kb_articles.findMany({
    orderBy: { updated_at: 'desc' },
    include: KB_ARTICLE_INCLUDE,
  });

  return NextResponse.json(articles.map(toKbDTO));
}

/** Quick-add from the KB page's "เพิ่มบทความใหม่" form: one title, category and step. */
export async function POST(req) {
  const { title, cat, step } = await req.json();

  if (!title?.trim() || !cat?.trim() || !step?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  }

  const category = await prisma.categories.findUnique({ where: { name: cat } });
  if (!category) {
    return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้' }, { status: 400 });
  }

  const tagText = title.trim().toLowerCase();
  const tag = await prisma.tags.upsert({
    where: { tag: tagText },
    create: { tag: tagText },
    update: {},
  });

  const created = await prisma.kb_articles.create({
    data: {
      category_id: category.id,
      title: title.trim(),
      summary: step.trim().slice(0, 60),
      kb_steps: { create: { step_no: 1, content: step.trim() } },
      kb_article_tags: { create: { tag_id: tag.id } },
    },
    include: KB_ARTICLE_INCLUDE,
  });

  return NextResponse.json(toKbDTO(created), { status: 201 });
}
