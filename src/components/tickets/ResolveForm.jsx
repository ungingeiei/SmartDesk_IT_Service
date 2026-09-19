'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

/** Resolution summary an agent writes when closing out a ticket. */
export default function ResolveForm({ onCancel, onConfirm }) {
  const [text, setText] = useState('');

  return (
    <div className="my-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="สรุปวิธีแก้ไข"
        className="min-h-[70px] w-full resize-y rounded-[10px] border border-line
          bg-surface px-3 py-2.5 text-md text-ink outline-none transition-colors
          placeholder:text-ink-faint focus:border-indigo"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button size="sm" onClick={() => onConfirm(text.trim())} disabled={!text.trim()}>
          บันทึกและแจ้งผู้ใช้
        </Button>
      </div>
    </div>
  );
}
