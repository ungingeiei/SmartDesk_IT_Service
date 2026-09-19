import Link from 'next/link';
import KbBanner from './KbBanner';
import Highlight from './Highlight';
import Pill from '@/components/ui/Pill';

/**
 * Article tile.
 *
 * `compact` is the variant used on the ticket wizard's self-service results,
 * which drops the tag row and fixes the card width so the centred flex grid
 * lines up.
 */
export default function KbCard({ article, query, compact = false, href, onClick }) {
  return (
    <Link
      href={href ?? `/kb/${article.id}`}
      onClick={onClick}
      className={`group block overflow-hidden rounded-m border border-line bg-surface shadow-card
        transition hover:-translate-y-[3px] hover:shadow-soft active:scale-[0.97]
        ${compact ? 'max-w-[320px] flex-[0_1_320px]' : ''}`}
    >
      <KbBanner cat={article.cat} />
      <div className="px-[18px] pt-4 pb-[18px]">
        <h3 className="mb-2 text-xl font-bold">
          <Highlight text={article.title} query={query} />
        </h3>
        <p className={`text-base text-ink-soft ${compact ? 'm-0' : 'mb-3.5'}`}>{article.summary}</p>
        {compact ? null : (
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="category" className="px-2.5 py-1 text-xs">
              {article.cat}
            </Pill>
            <Pill tone="neutral" className="px-2.5 py-1 text-xs">
              คู่มือ
            </Pill>
            <span className="ml-auto text-xs2 text-ink-faint">{article.views} views</span>
          </div>
        )}
      </div>
    </Link>
  );
}
