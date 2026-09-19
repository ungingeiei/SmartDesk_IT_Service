'use client';

import Button from '@/components/ui/Button';

const BASE = `cursor-pointer rounded-full border px-[18px] py-[9px] text-base font-bold transition-colors`;

/** "Did this article help?" — yes shows thanks, no offers to open a ticket. */
export default function FeedbackBlock({ choice, onChoose, canReport, onReport }) {
  return (
    <div className="mb-[22px] border-y border-line">
      <div className="flex flex-wrap items-center gap-3.5 pt-5 pb-3.5">
        <span className="text-md font-semibold">บทความนี้ช่วยแก้ปัญหาได้หรือไม่</span>
        <button
          type="button"
          onClick={() => onChoose('yes')}
          aria-pressed={choice === 'yes'}
          className={`${BASE} ${
            choice === 'yes'
              ? 'border-low bg-low-soft text-low'
              : 'border-line bg-surface text-ink-soft hover:border-indigo'
          }`}
        >
          ได้
        </button>
        <button
          type="button"
          onClick={() => onChoose('no')}
          aria-pressed={choice === 'no'}
          className={`${BASE} ${
            choice === 'no'
              ? 'border-ink-faint bg-surface-alt text-ink'
              : 'border-line bg-surface text-ink-soft hover:border-indigo'
          }`}
        >
          ไม่ได้
        </button>
      </div>

      {choice === 'yes' ? (
        <div className="pb-[18px] text-base font-semibold text-low">
          ขอบคุณสำหรับความคิดเห็นของคุณ ดีใจที่บทความนี้ช่วยได้ครับ
        </div>
      ) : null}

      {choice === 'no' ? (
        <div className="flex flex-wrap items-center gap-3 pb-[18px] text-base">
          <span className="text-ink-soft">
            เสียใจด้วยที่บทความนี้ยังช่วยไม่ได้ ลองแจ้งปัญหาให้ทีม IT ช่วยดูได้เลย
          </span>
          {canReport ? (
            <Button size="sm" onClick={onReport}>
              แจ้งพนักงาน IT
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
