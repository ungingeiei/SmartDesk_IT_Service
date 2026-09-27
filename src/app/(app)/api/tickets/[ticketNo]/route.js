import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TICKET_INCLUDE, mapTicket } from '@/lib/serialize';

const VALID_STATUS = ['new', 'in_progress', 'pending', 'resolved', 'closed'];

/**
 * Auto-files the resolution as a new KB article once the reporter confirms
 * the fix — the same thing the original mock store did on confirmFixedYes,
 * but for real. Linked by kb_articles.source_ticket_id (unique), so this is
 * safe to call even if it somehow runs twice for the same ticket.
 */
async function fileResolutionAsArticle(ticket) {
  if (!ticket.resolution_summary) return;
  const existing = await prisma.kb_articles.findUnique({
    where: { source_ticket_id: ticket.id },
  });
  if (existing) return;

  const tag = await prisma.tags.upsert({
    where: { tag: ticket.title.toLowerCase() },
    update: {},
    create: { tag: ticket.title.toLowerCase() },
  });

  await prisma.kb_articles.create({
    data: {
      category_id: ticket.category_id,
      title: `วิธีแก้: ${ticket.title}`,
      summary: ticket.resolution_summary.slice(0, 255),
      source_ticket_id: ticket.id,
      kb_steps: { create: [{ step_no: 1, content: ticket.resolution_summary }] },
      kb_article_tags: { create: [{ tag_id: tag.id }] },
    },
  });
}

// PATCH /api/tickets/:ticketNo — every write action the two ticket-detail
// pages (tickets/[id] and queue/[id]) perform, keyed by `action` in the body
// so one route covers the whole conversation + workflow instead of nine:
//
//   claim            { userId }
//   setStatus        { status }
//   reopen           {}
//   resolve          { userId, summary }
//   addInternalNote  { userId, text }
//   sendChat         { userId, text, staff }
//   confirmYes       {}   — also files the resolution as a KB article
//   confirmNo        {}
//   setCsat          { csat }
//
// Always returns the full ticket, freshly mapped, so the caller can just
// replace its copy of it in the tickets list.
export async function PATCH(req, { params }) {
  const { ticketNo } = await params;
  const body = await req.json().catch(() => ({}));

  const ticket = await prisma.tickets.findUnique({ where: { ticket_no: ticketNo } });
  if (!ticket) {
    return NextResponse.json({ error: 'ไม่พบ ticket นี้' }, { status: 404 });
  }

  switch (body.action) {
    case 'claim': {
      if (!body.userId) {
        return NextResponse.json({ error: 'ต้องระบุ userId' }, { status: 400 });
      }
      await prisma.tickets.update({
        where: { id: ticket.id },
        data: {
          assignee_id: Number(body.userId),
          status: ticket.status === 'new' ? 'in_progress' : ticket.status,
        },
      });
      break;
    }

    case 'setStatus': {
      if (!VALID_STATUS.includes(body.status)) {
        return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
      }
      await prisma.tickets.update({ where: { id: ticket.id }, data: { status: body.status } });
      break;
    }

    case 'reopen': {
      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { status: 'in_progress', reopened_count: { increment: 1 }, confirmed_by_reporter: false },
      });
      break;
    }

    case 'resolve': {
      if (!body.userId || !body.summary?.trim()) {
        return NextResponse.json({ error: 'กรุณากรอกสรุปวิธีแก้ไข' }, { status: 400 });
      }
      const summary = body.summary.trim();
      await prisma.$transaction([
        prisma.tickets.update({
          where: { id: ticket.id },
          data: { resolution_summary: summary, status: 'resolved', resolved_at: new Date() },
        }),
        prisma.ticket_messages.create({
          data: {
            ticket_id: ticket.id,
            sender_id: Number(body.userId),
            is_staff: true,
            message: `แก้ไขปัญหาเรียบร้อยแล้วครับ/ค่ะ สรุป: ${summary}`,
          },
        }),
      ]);
      break;
    }

    case 'addInternalNote': {
      if (!body.userId || !body.text?.trim()) {
        return NextResponse.json({ error: 'กรุณากรอกบันทึก' }, { status: 400 });
      }
      await prisma.ticket_internal_notes.create({
        data: { ticket_id: ticket.id, author_id: Number(body.userId), note: body.text.trim() },
      });
      break;
    }

    case 'sendChat': {
      if (!body.userId || !body.text?.trim()) {
        return NextResponse.json({ error: 'กรุณากรอกข้อความ' }, { status: 400 });
      }
      await prisma.ticket_messages.create({
        data: {
          ticket_id: ticket.id,
          sender_id: Number(body.userId),
          is_staff: !!body.staff,
          message: body.text.trim(),
        },
      });
      break;
    }

    case 'confirmYes': {
      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { status: 'closed', confirmed_by_reporter: true },
      });
      await fileResolutionAsArticle(ticket);
      break;
    }

    case 'confirmNo': {
      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { status: 'in_progress', reopened_count: { increment: 1 } },
      });
      break;
    }

    case 'setCsat': {
      if (!Number.isInteger(body.csat)) {
        return NextResponse.json({ error: 'คะแนนไม่ถูกต้อง' }, { status: 400 });
      }
      await prisma.tickets.update({ where: { id: ticket.id }, data: { csat_score: body.csat } });
      break;
    }

    default:
      return NextResponse.json({ error: 'ไม่รู้จัก action นี้' }, { status: 400 });
  }

  const updated = await prisma.tickets.findUnique({
    where: { ticket_no: ticketNo },
    include: TICKET_INCLUDE,
  });
  return NextResponse.json({ ticket: mapTicket(updated) });
}
