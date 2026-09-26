// Prisma seed script — ports the client-side mock data in src/lib/data.js
// into the real Postgres schema via Prisma Client, replacing the manual
// database/02_reference_data.sql + 03_test_data.sql inserts.
//
// This wipes and rebuilds every app-data table, so it's for dev/demo
// databases only — never point it at production.
//
// Run with: npx prisma db seed   (wired up in prisma.config.ts)

import { createRequire } from 'module';
import { PrismaClient } from '../src/app/generated/prisma/client.ts';
import bcrypt from 'bcryptjs';

// data.js has no "type": "module" boundary of its own, so Node's ESM loader
// can't reliably enumerate its named exports through tsx's transform —
// require() it instead, which hands back the real module.exports directly.
const require = createRequire(import.meta.url);
const {
  CATEGORIES,
  CAT_THEME,
  IMPACT_OPTS,
  URGENCY_OPTS,
  PRIORITY_MATRIX,
  SLA_HOURS,
  USERS,
  defaultKB,
  defaultTickets,
} = require('../src/lib/data.js');

const prisma = new PrismaClient();

// Every seeded user gets this password — matches the hint on the login page.
const DEMO_PASSWORD = 'Passw0rd1';

const THAI_MONTHS = {
  'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
  'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
};

/** Parses "2 ก.ย. 2569" or "12 ก.ย. 2569 08:40" (Buddhist year, D MMM YYYY [HH:mm]). */
function parseThaiDate(str, fallback = new Date()) {
  const m = String(str).match(/^(\d{1,2})\s+([ก-๙.]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return fallback;
  const [, day, monthTh, yearBE, hour, minute] = m;
  const month = THAI_MONTHS[monthTh];
  if (month === undefined) return fallback;
  return new Date(Number(yearBE) - 543, month, Number(day), Number(hour ?? 0), Number(minute ?? 0));
}

/** "IT-MGR-01" -> "itmgr01" — mirrors src/lib/users.js#usernameFromCode. */
function usernameFromCode(code) {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function resetTables() {
  // kb_articles <-> tickets reference each other (source_ticket_id / ai_suggested_kb_id),
  // same cycle database/01_schema.sql calls out — break it before deleting either side.
  await prisma.kb_articles.updateMany({ data: { source_ticket_id: null } });
  await prisma.tickets.updateMany({ data: { ai_suggested_kb_id: null } });

  // Children before parents, per the FKs in database/01_schema.sql.
  await prisma.ticket_internal_notes.deleteMany();
  await prisma.ticket_messages.deleteMany();
  await prisma.kb_deflections.deleteMany();
  await prisma.kb_feedback.deleteMany();
  await prisma.kb_comments.deleteMany();
  await prisma.kb_article_tags.deleteMany();
  await prisma.kb_steps.deleteMany();
  await prisma.password_reset_tokens.deleteMany();
  await prisma.tickets.deleteMany();
  await prisma.kb_articles.deleteMany();
  await prisma.tags.deleteMany();
  await prisma.priority_matrix.deleteMany();
  await prisma.sla_policies.deleteMany();
  await prisma.urgency_levels.deleteMany();
  await prisma.impact_levels.deleteMany();
  await prisma.users.deleteMany();
  await prisma.categories.deleteMany();
}

async function seedCategories() {
  const byName = new Map();
  for (const name of CATEGORIES) {
    const row = await prisma.categories.create({
      data: { name, bg_color: CAT_THEME[name].bg, accent_color: CAT_THEME[name].accent },
    });
    byName.set(name, row.id);
  }
  return byName;
}

async function seedLevelsAndPolicies() {
  for (const o of IMPACT_OPTS) {
    await prisma.impact_levels.create({ data: { id: o.v, label: o.label } });
  }
  for (const o of URGENCY_OPTS) {
    await prisma.urgency_levels.create({ data: { id: o.v, label: o.label } });
  }
  for (const [key, priority] of Object.entries(PRIORITY_MATRIX)) {
    const [impact_id, urgency_id] = key.split('-').map(Number);
    await prisma.priority_matrix.create({ data: { impact_id, urgency_id, priority } });
  }
  for (const [priority, hours] of Object.entries(SLA_HOURS)) {
    await prisma.sla_policies.create({ data: { priority, resolve_within_hours: hours } });
  }
}

async function seedUsers() {
  const pwd_hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const byName = new Map();
  const byCode = new Map();
  for (const u of USERS) {
    const row = await prisma.users.create({
      data: {
        employee_code: u.code,
        name: u.name,
        username: usernameFromCode(u.code),
        email: u.email,
        pwd_hash,
        role: u.role,
        title: u.title,
      },
    });
    byName.set(u.name, row);
    byCode.set(u.code, row);
  }
  return { byName, byCode };
}

/** Returns a Map from the mock's string kb id (e.g. "kb4") to the new integer PK. */
async function seedKb(categoryIdByName, userByName) {
  const articleIdByMockId = new Map();
  const tagIdByTag = new Map();

  for (const article of defaultKB()) {
    const updatedAt = parseThaiDate(article.updated);
    const created = await prisma.kb_articles.create({
      data: {
        category_id: categoryIdByName.get(article.cat),
        title: article.title,
        summary: article.summary,
        views: article.views,
        created_at: updatedAt,
        updated_at: updatedAt,
      },
    });
    articleIdByMockId.set(article.id, created.id);

    for (let i = 0; i < article.steps.length; i++) {
      await prisma.kb_steps.create({
        data: { kb_id: created.id, step_no: i + 1, content: article.steps[i] },
      });
    }

    for (const tag of article.tags) {
      let tagId = tagIdByTag.get(tag);
      if (!tagId) {
        const row = await prisma.tags.upsert({ where: { tag }, create: { tag }, update: {} });
        tagId = row.id;
        tagIdByTag.set(tag, tagId);
      }
      await prisma.kb_article_tags.create({ data: { kb_id: created.id, tag_id: tagId } });
    }

    for (const comment of article.comments) {
      // Contributors like "ธีรภัทร คงสุข" aren't in USERS — author_id stays
      // null and author_name carries the display name, as the schema intends.
      const author = userByName.get(comment.who);
      await prisma.kb_comments.create({
        data: {
          kb_id: created.id,
          author_id: author?.id ?? null,
          author_name: comment.who,
          comment: comment.txt,
          votes: comment.votes,
          is_accepted: comment.accepted,
          created_at: parseThaiDate(comment.when, updatedAt),
        },
      });
    }
  }

  return articleIdByMockId;
}

async function seedTickets(categoryIdByName, userByName, userByCode, articleIdByMockId) {
  for (const t of defaultTickets()) {
    const reporter = userByName.get(t.reporter);
    const assignee = t.assignee ? userByCode.get(t.assignee.code) : null;
    const createdAt = new Date(t.createdAt);

    const created = await prisma.tickets.create({
      data: {
        ticket_no: t.id,
        title: t.title,
        description: t.desc,
        impact_id: t.impact,
        urgency_id: t.urgency,
        priority: t.priority,
        status: t.status,
        category_id: categoryIdByName.get(t.cat),
        reporter_id: reporter.id,
        assignee_id: assignee?.id ?? null,
        created_at: createdAt,
        resolution_summary: t.resolutionSummary,
        resolved_at: t.resolvedAt ? new Date(t.resolvedAt) : null,
        csat_score: t.csat,
        confirmed_by_reporter: t.confirmed,
        reopened_count: t.reopenedCount,
        ai_suggested_kb_id: t.aiSuggestion ? articleIdByMockId.get(t.aiSuggestion.kbId) ?? null : null,
        ai_confidence: t.aiSuggestion?.confidence ?? null,
      },
    });

    // Mock chat/note timestamps omit the year ("23 มิ.ย. 08:40"), so space
    // them out from the ticket's own createdAt instead of guessing a year.
    for (let i = 0; i < t.chat.length; i++) {
      const msg = t.chat[i];
      const sender = userByName.get(msg.who);
      await prisma.ticket_messages.create({
        data: {
          ticket_id: created.id,
          sender_id: sender?.id ?? reporter.id,
          is_staff: msg.staff,
          message: msg.txt,
          sent_at: new Date(createdAt.getTime() + (i + 1) * 30 * 60 * 1000),
        },
      });
    }

    for (let i = 0; i < t.internalNotes.length; i++) {
      const note = t.internalNotes[i];
      const author = userByName.get(note.who);
      await prisma.ticket_internal_notes.create({
        data: {
          ticket_id: created.id,
          author_id: author?.id ?? reporter.id,
          note: note.txt,
          created_at: new Date(createdAt.getTime() + (i + 1) * 20 * 60 * 1000),
        },
      });
    }
  }
}

async function main() {
  console.log('Resetting tables...');
  await resetTables();

  console.log('Seeding categories...');
  const categoryIdByName = await seedCategories();

  console.log('Seeding impact/urgency levels, priority matrix, SLA policies...');
  await seedLevelsAndPolicies();

  console.log(`Seeding users (demo password: ${DEMO_PASSWORD})...`);
  const { byName: userByName, byCode: userByCode } = await seedUsers();

  console.log('Seeding knowledge base...');
  const articleIdByMockId = await seedKb(categoryIdByName, userByName);

  console.log('Seeding tickets...');
  await seedTickets(categoryIdByName, userByName, userByCode, articleIdByMockId);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
