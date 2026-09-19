'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

/** IT-only scratchpad on the agent workspace. Admins read it but cannot add to it. */
export default function InternalNotes({ notes, canAdd, onAdd }) {
  const [text, setText] = useState('');

  function handleAdd() {
    const txt = text.trim();
    if (!txt) return;
    onAdd(txt);
    setText('');
  }

  return (
    <div className="my-4 rounded-m border border-dashed border-note-line bg-note-bg px-4 py-3.5">
      <h4 className="mb-2 text-sm2 text-medium">
        🔒 บันทึกภายใน (ทีม IT เท่านั้น — ผู้แจ้งมองไม่เห็น)
      </h4>

      {notes.length === 0 ? (
        <div className="mb-2 text-sm text-ink-faint">ยังไม่มีบันทึก</div>
      ) : (
        notes.map((note, i) => (
          <div key={i} className="mb-2 rounded-s bg-white px-3 py-[9px] text-base text-ink">
            <div className="mb-[3px] text-xs text-ink-faint">
              {note.who} · {note.when}
            </div>
            {note.txt}
          </div>
        ))
      )}

      {canAdd ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="เพิ่มบันทึกภายใน..."
            className="min-w-0 flex-1 rounded-s border border-note-line bg-white px-2.5 py-2
              text-base text-ink outline-none placeholder:text-ink-faint"
          />
          <Button size="sm" onClick={handleAdd} disabled={!text.trim()}>
            บันทึก
          </Button>
        </div>
      ) : null}
    </div>
  );
}
