import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatThaiDateTime, formatThaiTime } from '@/lib/logic';

/** Reshapes a DB row back into the ticket object the UI/store already expects. */
function toTicketDTO(t) {
  const assignee = t.users_tickets_assignee_idTousers;
  const aiArticle = t.kb_articles_tickets_ai_suggested_kb_idTokb_articles;

  return {
    id: t.ticket_no,
    title: t.title,
    desc: t.description,
    impact: t.impact_id,
    urgency: t.urgency_id,
    priority: t.priority,
    status: t.status,
    cat: t.categories.name,
    created: formatThaiDateTime(t.created_at),
    createdAt: t.created_at.getTime(),
    reporter: t.users_tickets_reporter_idTousers.name,
    assignee: assignee ? { name: assignee.name, code: assignee.employee_code } : null,
    chat: t.ticket_messages.map((m) => ({
      who: m.users.name,
      staff: m.is_staff,
      when: formatThaiTime(m.sent_at),
      txt: m.message,
    })),
    internalNotes: t.ticket_internal_notes.map((n) => ({
      who: n.users.name,
      when: formatThaiTime(n.created_at),
      txt: n.note,
    })),
    resolutionSummary: t.resolution_summary,
    resolvedAt: t.resolved_at ? t.resolved_at.getTime() : null,
    csat: t.csat_score,
    confirmed: t.confirmed_by_reporter,
    reopenedCount: t.reopened_count,
    aiSuggestion: t.ai_suggested_kb_id
      ? { kbId: String(t.ai_suggested_kb_id), text: aiArticle?.title ?? '', confidence: t.ai_confidence ?? 0 }
      : null,
  };
}

export async function GET() {
  const tickets = await prisma.tickets.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      categories: true,
      users_tickets_reporter_idTousers: true,
      users_tickets_assignee_idTousers: true,
      kb_articles_tickets_ai_suggested_kb_idTokb_articles: { select: { title: true } },
      ticket_messages: { orderBy: { sent_at: 'asc' }, include: { users: true } },
      ticket_internal_notes: { orderBy: { created_at: 'asc' }, include: { users: true } },
    },
  });

  return NextResponse.json(tickets.map(toTicketDTO));
}
