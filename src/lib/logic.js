// Pure helpers ported from the handoff design (SmartDesk.dc.html).
// No React here so pages, components and the store can all share them.

import { CATEGORIES, CAT_THEME, PRIORITY_MATRIX, SLA_HOURS } from './data';

/** Impact x Urgency lookup table — deliberately not AI, per the design's note. */
export function calcPriority(impact, urgency) {
  return PRIORITY_MATRIX[`${impact}-${urgency}`] || null;
}

/**
 * SLA countdown for a ticket. `now` comes from `useNow()` and is null until the
 * client has mounted, so the badge can render a placeholder instead of text that
 * would differ between the server and client renders.
 */
export function slaInfo(ticket, now) {
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    return { label: 'ปิดงานภายในกำหนด SLA', bg: '#F4F5FA', color: '#8E92A8' };
  }
  if (now == null) return null;

  const hours = SLA_HOURS[ticket.priority] || 24;
  const remainMs = ticket.createdAt + hours * 3600 * 1000 - now;
  if (remainMs <= 0) {
    return { label: 'เกินกำหนด SLA แล้ว', bg: '#FBE9E7', color: '#B3261E' };
  }

  const mins = Math.round(remainMs / 60000);
  const label =
    mins < 60
      ? `เหลือเวลาตาม SLA ${mins} นาที`
      : `เหลือเวลาตาม SLA ${Math.round(mins / 60)} ชั่วโมง`;
  return mins < 60
    ? { label, bg: '#FCEEDD', color: '#B5580A' }
    : { label, bg: '#E2F3E8', color: '#1E7A46' };
}

/** Free-text + category search over the knowledge base. */
export function matchKB(kb, query, cats) {
  const q = (query || '').trim().toLowerCase();
  return kb.filter((item) => {
    if (cats && cats.length > 0 && !cats.includes(item.cat)) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.cat.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Guess a category for a new ticket from keyword overlap with KB tags. */
export function guessCategory(kb, text) {
  const q = (text || '').toLowerCase();
  for (const item of kb) {
    if (item.tags.some((t) => q.includes(t.toLowerCase()))) return item.cat;
  }
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

/** Simulated AI: look for a plausible KB fix before the ticket is even opened. */
export function guessAiSuggestion(kb, title, desc) {
  const words = `${title} ${desc}`.split(' ').slice(0, 4).join(' ');
  const best = matchKB(kb, words, [])[0];
  if (!best) return null;
  return {
    kbId: best.id,
    text: best.title,
    confidence: 60 + Math.floor(Math.random() * 33),
  };
}

/** "12 ก.ย. 2569 08:40" — the format the seeded tickets use. */
export function formatThaiDateTime(date) {
  const d = date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${d} ${formatThaiTime(date)}`;
}

export function formatThaiTime(date) {
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

/** Background + accent colours for an article banner, keyed by category. */
export function bannerTheme(cat) {
  return CAT_THEME[cat] || CAT_THEME['ซอฟต์แวร์'];
}

/** First character, used for every avatar and banner monogram in the design. */
export function initialOf(text) {
  return (text || '?').slice(0, 1);
}
