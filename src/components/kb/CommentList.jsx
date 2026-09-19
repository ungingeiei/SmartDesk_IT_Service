'use client';

import { useState } from 'react';
import { initialOf } from '@/lib/logic';
import Avatar from '@/components/ui/Avatar';
import SendButton from '@/components/ui/SendButton';
import { CheckIcon } from '@/components/icons';

/**
 * Answers on an article. Accepted answers float to the top and are tinted green;
 * the rest fall back to vote count for ordering, matching the design's sort.
 */
export default function CommentList({ comments, onAccept, onSend }) {
  const sorted = [...comments].sort(
    (a, b) => Number(b.accepted) - Number(a.accepted) || (b.votes || 0) - (a.votes || 0),
  );

  return (
    <div>
      <h4 className="mb-3.5 text-lg font-bold">คำตอบ / ความคิดเห็น ({comments.length})</h4>

      {sorted.map((comment) => {
        // Index into the *original* array, which is what the accept action mutates.
        const index = comments.indexOf(comment);
        return (
          <div
            key={index}
            className={`mb-4 flex gap-2.5 ${
              comment.accepted ? 'rounded-[10px] bg-low-soft px-3 py-2.5' : ''
            }`}
          >
            <Avatar initial={initialOf(comment.who)} size={34} />
            <div className="min-w-0 flex-1 text-base">
              <span className="mr-2 font-bold">{comment.who}</span>
              <span className="text-xs2 text-ink-faint">{comment.when}</span>
              {comment.accepted ? (
                <span
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-low px-2 py-0.5
                    text-2xs font-bold text-white"
                >
                  <CheckIcon size={11} /> คำตอบที่ยอมรับ
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAccept(index)}
                  className="ml-2 cursor-pointer rounded-full border border-line bg-surface
                    px-[9px] py-[3px] text-xs font-semibold text-ink-soft
                    hover:border-low hover:text-low"
                >
                  ทำเครื่องหมายว่าดีที่สุด
                </button>
              )}
              <div className="mt-[3px] text-ink-soft">{comment.txt}</div>
            </div>
          </div>
        );
      })}

      <CommentComposer onSend={onSend} />
    </div>
  );
}

function CommentComposer({ onSend }) {
  const [text, setText] = useState('');

  function handleSend() {
    const txt = text.trim();
    if (!txt) return;
    onSend(txt);
    setText('');
  }

  return (
    <div className="mt-1.5 flex gap-2.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="แสดงความคิดเห็นหรือแนะนำวิธีแก้เพิ่มเติม..."
        className="min-h-11 flex-1 resize-y rounded-s border border-line bg-surface-alt
          px-[13px] py-2.5 text-md text-ink outline-none transition-colors
          placeholder:text-ink-faint focus:border-indigo"
      />
      <SendButton onClick={handleSend} disabled={!text.trim()} />
    </div>
  );
}
