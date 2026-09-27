// Server-only shapes shared by the KB API routes (article list/create, comments).

import { formatThaiDate } from './logic';

export const KB_ARTICLE_INCLUDE = {
  categories: true,
  kb_steps: { orderBy: { step_no: 'asc' } },
  kb_article_tags: { include: { tags: true } },
  kb_comments: { orderBy: { created_at: 'asc' } },
};

/** Reshapes a DB row back into the KB comment object the UI/store already expects. */
export function toCommentDTO(c) {
  return {
    id: c.id,
    who: c.author_name,
    when: formatThaiDate(c.created_at),
    txt: c.comment,
    votes: c.votes,
    accepted: c.is_accepted,
  };
}

/** Reshapes a DB row back into the KB article object the UI/store already expects. */
export function toKbDTO(a) {
  return {
    id: String(a.id),
    cat: a.categories.name,
    title: a.title,
    summary: a.summary,
    updated: formatThaiDate(a.updated_at),
    views: a.views,
    tags: a.kb_article_tags.map((link) => link.tags.tag),
    steps: a.kb_steps.map((s) => s.content),
    comments: a.kb_comments.map(toCommentDTO),
  };
}
