import Link from 'next/link';
import { bannerTheme, initialOf } from '@/lib/logic';

export default function RelatedArticles({ articles }) {
  if (!articles.length) return null;

  return (
    <div className="mb-[26px]">
      <h4 className="mb-3.5 text-lg font-bold">บทความที่เกี่ยวข้อง</h4>
      {articles.map((article) => {
        const theme = bannerTheme(article.cat);
        return (
          <Link
            key={article.id}
            href={`/kb/${article.id}`}
            className="mb-2.5 flex items-center gap-3.5 rounded-m border border-line p-2.5
              transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div
              style={{ background: theme.accent }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]
                font-extrabold text-white"
            >
              {initialOf(article.cat)}
            </div>
            <div className="min-w-0">
              <div className="mb-1 truncate text-md font-bold">{article.title}</div>
              <div className="text-xs2 text-ink-faint">
                {article.cat} · {article.views} views
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
