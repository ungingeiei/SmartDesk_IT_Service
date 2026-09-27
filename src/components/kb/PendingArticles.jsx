import Link from 'next/link';
import Button from '@/components/ui/Button';
import KbStatusPill from './KbStatusPill';

/**
 * Articles that are not published yet, shown above the KB grid.
 *
 * For หัวหน้าทีม IT (`isReviewer`) it is the approval queue, with approve /
 * reject on each row. For everyone else it lists their own submissions so
 * they can see whether each one is still waiting or was turned down.
 */
export default function PendingArticles({ articles, isReviewer, onApprove, onReject }) {
  if (!articles.length) return null;

  return (
    <section
      aria-label={isReviewer ? 'บทความรออนุมัติ' : 'บทความของฉันที่ยังไม่เผยแพร่'}
      className="mb-6 rounded-m border border-line bg-surface p-[18px] shadow-card"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-extrabold">
          {isReviewer ? 'บทความรออนุมัติ' : 'บทความของฉันที่ยังไม่เผยแพร่'}
        </h2>
        <span className="text-sm2 text-ink-faint">{articles.length} บทความ</span>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {articles.map((article) => (
          <li
            key={article.id}
            className="flex flex-wrap items-center gap-3 rounded-s border border-line px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/kb/${article.id}`}
                className="mb-1 block truncate text-md font-bold hover:text-indigo"
              >
                {article.title}
              </Link>
              <div className="text-xs2 text-ink-faint">
                {article.cat}
                {article.authorName ? ` · โดย ${article.authorName}` : ''} · {article.updated}
              </div>
            </div>

            {isReviewer && article.status === 'pending' ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onApprove(article.id)}>
                  อนุมัติ
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onReject(article.id)}>
                  ไม่อนุมัติ
                </Button>
              </div>
            ) : (
              <KbStatusPill status={article.status} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
