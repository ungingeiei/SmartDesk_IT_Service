// Server-only. Maps Prisma rows (the real, snake_case DB shape) onto the
// camelCase view-model shape the UI already expects — the same shape the
// demo mock data in src/lib/data.js (defaultKB / defaultTickets) produced.
// Keeping the mapping here means the existing pages/components (KbCard,
// TicketRow, kb/[id], tickets/[id], queue/[id] ...) need no changes at all:
// they still just read article.cat, ticket.assignee.name, etc.

import { formatThaiDate, formatThaiDateTime, formatThaiTime } from './logic';

/** Prisma `include` for a kb_articles row that mapKbArticle() can fully map. */
export const KB_ARTICLE_INCLUDE = {
  categories: true,
  kb_article_tags: { include: { tags: true } },
  kb_steps: true,
  kb_comments: true,
};

/** Prisma `include` for a tickets row that mapTicket() can fully map. */
export const TICKET_INCLUDE = {
  categories: true,
  users_tickets_reporter_idTousers: true,
  users_tickets_assignee_idTousers: true,
  kb_articles_tickets_ai_suggested_kb_idTokb_articles: true,
  ticket_messages: { include: { users: true } },
  ticket_internal_notes: { include: { users: true } },
};

/** A kb_articles row (fetched with KB_ARTICLE_INCLUDE) -> the mock KB article shape. */
export function mapKbArticle(row) {
  return {
    id: String(row.id),
    cat: row.categories?.name ?? '',
    title: row.title,
    summary: row.summary ?? '',
    updated: formatThaiDate(row.updated_at),
    views: row.views,
    tags: (row.kb_article_tags ?? []).map((t) => t.tags.tag),
    steps: (row.kb_steps ?? [])
      .slice()
      .sort((a, b) => a.step_no - b.step_no)
      .map((s) => s.content),
    comments: (row.kb_comments ?? [])
      .slice()
      .sort((a, b) => a.created_at - b.created_at)
      .map((c) => ({
        who: c.author_name,
        when: formatThaiDate(c.created_at),
        txt: c.comment,
        votes: c.votes,
        accepted: c.is_accepted,
      })),
  };
}

/** A tickets row (fetched with TICKET_INCLUDE) -> the mock ticket shape. */
export function mapTicket(row) {
  const assignee = row.users_tickets_assignee_idTousers;
  const suggestedKb = row.kb_articles_tickets_ai_suggested_kb_idTokb_articles;

  return {
    id: row.ticket_no,
    title: row.title,
    desc: row.description,
    impact: row.impact_id,
    urgency: row.urgency_id,
    priority: row.priority,
    status: row.status,
    cat: row.categories?.name ?? '',
    created: formatThaiDateTime(row.created_at),
    createdAt: row.created_at.getTime(),
    reporter: row.users_tickets_reporter_idTousers?.name ?? '',
    assignee: assignee ? { name: assignee.name, code: assignee.employee_code } : null,
    chat: (row.ticket_messages ?? [])
      .slice()
      .sort((a, b) => a.sent_at - b.sent_at)
      .map((m) => ({
        who: m.users?.name ?? '',
        staff: m.is_staff,
        when: formatThaiTime(m.sent_at),
        txt: m.message,
      })),
    internalNotes: (row.ticket_internal_notes ?? [])
      .slice()
      .sort((a, b) => a.created_at - b.created_at)
      .map((n) => ({
        who: n.users?.name ?? '',
        when: formatThaiTime(n.created_at),
        txt: n.note,
      })),
    resolutionSummary: row.resolution_summary,
    resolvedAt: row.resolved_at ? row.resolved_at.getTime() : null,
    csat: row.csat_score,
    confirmed: row.confirmed_by_reporter,
    reopenedCount: row.reopened_count,
    aiSuggestion: row.ai_suggested_kb_id
      ? { kbId: String(row.ai_suggested_kb_id), text: suggestedKb?.title ?? '', confidence: row.ai_confidence }
      : null,
  };
}
