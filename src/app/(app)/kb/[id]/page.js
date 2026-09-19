'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import BackLink from '@/components/ui/BackLink';
import EmptyState from '@/components/ui/EmptyState';
import KbBanner from '@/components/kb/KbBanner';
import StepsList from '@/components/kb/StepsList';
import FeedbackBlock from '@/components/kb/FeedbackBlock';
import RelatedArticles from '@/components/kb/RelatedArticles';
import CommentList from '@/components/kb/CommentList';
import { FolderIcon } from '@/components/icons';

export default function ArticlePage({ params }) {
  const { id } = use(params);
  const { kb, currentUser, fbChoice, setFeedback, addComment, acceptComment } = useApp();
  const router = useRouter();

  const article = kb.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
        <BackLink href="/kb">← กลับ</BackLink>
        <EmptyState icon={<FolderIcon size={34} />} title="ไม่พบบทความนี้" />
      </div>
    );
  }

  const related = kb
    .filter((a) => a.id !== article.id && a.cat === article.cat)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  /**
   * "This didn't help" → open the ticket form pre-filled with the article, so
   * the employee does not retype what they already tried.
   */
  function reportToIT() {
    const prefill = new URLSearchParams({
      title: article.title,
      desc: `ลองอ่านบทความ "${article.title}" ในคลังความรู้แล้ว แต่ยังแก้ปัญหาไม่ได้`,
    });
    router.push(`/tickets/new?${prefill}`);
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <BackLink href="/kb">← กลับ</BackLink>

      <Card>
        <KbBanner cat={article.cat} height={180} discSize={52} className="mb-6 rounded-m" />

        <Pill tone="category" className="mb-3.5 px-2.5 py-1 text-xs">
          {article.cat}
        </Pill>
        <h2 className="mt-0 mb-2 text-[25px] font-extrabold tracking-[-0.01em]">{article.title}</h2>
        <div className="mb-[22px] border-b border-line pb-[22px] text-sm2 text-ink-faint">
          อัปเดต {article.updated} · {article.views} views
        </div>

        <StepsList steps={article.steps} />

        <FeedbackBlock
          choice={fbChoice[article.id]}
          onChoose={(choice) => setFeedback(article.id, choice)}
          canReport={currentUser?.role === 'employee'}
          onReport={reportToIT}
        />

        <RelatedArticles articles={related} />

        <CommentList
          comments={article.comments}
          onAccept={(index) => acceptComment(article.id, index)}
          onSend={(txt) => addComment(article.id, currentUser, txt)}
        />
      </Card>
    </div>
  );
}
