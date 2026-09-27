'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import BackLink from '@/components/ui/BackLink';
import EmptyState from '@/components/ui/EmptyState';
import KbBanner from '@/components/kb/KbBanner';
import StepsList from '@/components/kb/StepsList';
import FeedbackBlock from '@/components/kb/FeedbackBlock';
import RelatedArticles from '@/components/kb/RelatedArticles';
import CommentList from '@/components/kb/CommentList';
import KbStatusPill from '@/components/kb/KbStatusPill';
import { FolderIcon } from '@/components/icons';

export default function ArticlePage({ params }) {
  const { id } = use(params);
  const {
    kb,
    kbPending,
    currentUser,
    fbChoice,
    setFeedback,
    addComment,
    acceptComment,
    reviewArticle,
    deleteArticle,
    recordView,
  } = useApp();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // A pending article is only in `kbPending`, which holds just the ones this
  // viewer may open: all of them for หัวหน้าทีม IT, their own for an author.
  const article = kb.find((a) => a.id === id) ?? kbPending.find((a) => a.id === id);
  const isReviewer = currentUser?.role === 'admin';
  const isPublished = article?.status === 'approved';

  useEffect(() => {
    if (isPublished) recordView(id);
  }, [id, isPublished, recordView]);

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
  async function handleDelete() {
    setDeleting(true);
    const deleted = await deleteArticle(article.id, currentUser);
    setDeleting(false);
    if (deleted) router.push('/kb');
    else setConfirmDelete(false);
  }

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

      {article.status !== 'approved' ? (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-m border border-note-line
            bg-note-bg px-[18px] py-3"
        >
          <KbStatusPill status={article.status} />
          <span className="flex-1 text-sm2 text-ink-soft">
            {article.status === 'rejected'
              ? 'หัวหน้าทีม IT ไม่อนุมัติบทความนี้ จึงไม่แสดงในคลังความรู้'
              : `บทความนี้ยังไม่เผยแพร่${article.authorName ? ` · ส่งโดย ${article.authorName}` : ''}`}
          </span>
          {isReviewer && article.status === 'pending' ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => reviewArticle(article.id, currentUser, 'approve')}>
                อนุมัติ
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reviewArticle(article.id, currentUser, 'reject')}
              >
                ไม่อนุมัติ
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Card>
        <KbBanner cat={article.cat} height={180} discSize={52} className="mb-6 rounded-m" />

        <Pill tone="category" className="mb-3.5 px-2.5 py-1 text-xs">
          {article.cat}
        </Pill>
        <h2 className="mt-0 mb-2 text-[25px] font-extrabold tracking-[-0.01em]">{article.title}</h2>
        <div
          className="mb-[22px] flex flex-wrap items-center justify-between gap-2 border-b
            border-line pb-[22px] text-sm2 text-ink-faint"
        >
          <span>
            อัปเดต {article.updated} · {article.views} views
          </span>
          {isReviewer ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="cursor-pointer rounded-full border border-line bg-transparent px-3.5 py-1.5
                text-sm2 font-semibold text-critical transition-colors hover:bg-critical-soft"
            >
              ลบบทความ
            </button>
          ) : null}
        </div>

        <StepsList steps={article.steps} />

        {/* Feedback, related articles and discussion only make sense once the article is live. */}
        {article.status === 'approved' ? (
          <>
            <FeedbackBlock
              choice={fbChoice[article.id]}
              onChoose={(choice) => setFeedback(article.id, choice)}
              canReport={currentUser?.role === 'employee'}
              onReport={reportToIT}
            />

            <RelatedArticles articles={related} />

            <CommentList
              comments={article.comments}
              onAccept={(commentId) => acceptComment(article.id, commentId)}
              onSend={(txt) => addComment(article.id, currentUser, txt)}
            />
          </>
        ) : null}
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => (deleting ? null : setConfirmDelete(false))}
        title="ลบบทความ"
      >
        <p className="mb-5 text-md text-ink-soft">
          ลบ “{article.title}” ออกจากคลังความรู้? ความคิดเห็นและข้อมูลที่เกี่ยวข้องจะถูกลบด้วย
          และไม่สามารถกู้คืนได้
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-critical! hover:opacity-90"
          >
            {deleting ? 'กำลังลบ...' : 'ลบบทความ'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
