import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { KB_ARTICLE_INCLUDE, TICKET_INCLUDE, mapKbArticle, mapTicket } from '@/lib/serialize';
import { guessAiSuggestion, guessCategory } from '@/lib/logic';

/**
 * "TK-101" style ticket numbers. Reads every existing number rather than
 * keeping a counter row, since this is a low-volume demo table; good enough
 * here, but a real deployment should use a DB sequence to avoid the race
 * between two reports filed at the same instant.
 */
async function nextTicketNo() {
  const rows = await prisma.tickets.findMany({ select: { ticket_no: true } });
  const max = rows.reduce((best, r) => {
    const n = Number(String(r.ticket_no).replace(/\D/g, ''));
    return Number.isFinite(n) && n > best ? n : best;
  }, 100);
  return `TK-${String(max + 1).padStart(3, '0')}`;
}

// "แจ้งปัญหา" (employee role) — files a new ticket. Priority is looked up
// from priority_matrix (impact x urgency) server-side rather than trusted
// from the client, and the category + AI "possible fix" suggestion are
// guessed from the KB the same way the demo store did on the client
// (src/lib/logic.js: guessCategory / guessAiSuggestion).
export async function POST(req) {
  const { title, desc, impact, urgency, reporterId } = await req.json().catch(() => ({}));

  if (!title?.trim() || !desc?.trim() || !impact || !urgency || !reporterId) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  const priorityRow = await prisma.priority_matrix.findUnique({
    where: { impact_id_urgency_id: { impact_id: Number(impact), urgency_id: Number(urgency) } },
  });
  if (!priorityRow) {
    return NextResponse.json({ error: 'ไม่พบระดับความสำคัญที่ตรงกับข้อมูลนี้' }, { status: 400 });
  }

  const kbRows = await prisma.kb_articles.findMany({ include: KB_ARTICLE_INCLUDE });
  const kb = kbRows.map(mapKbArticle);
  const catName = guessCategory(kb, `${title} ${desc}`);
  const category = await prisma.categories.findUnique({ where: { name: catName } });
  const aiSuggestion = guessAiSuggestion(kb, title, desc);

  const created = await prisma.tickets.create({
    data: {
      ticket_no: await nextTicketNo(),
      title: title.trim(),
      description: desc.trim(),
      impact_id: Number(impact),
      urgency_id: Number(urgency),
      priority: priorityRow.priority,
      status: 'new',
      category_id: category.id,
      reporter_id: Number(reporterId),
      ai_suggested_kb_id: aiSuggestion ? Number(aiSuggestion.kbId) : null,
      ai_confidence: aiSuggestion ? aiSuggestion.confidence : null,
    },
    include: TICKET_INCLUDE,
  });

  return NextResponse.json({ ticket: mapTicket(created) });
}
