'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/data';
import Button from '@/components/ui/Button';

const CONTROL = `rounded-s border border-line bg-surface-alt px-3 py-[9px] text-md text-ink
  outline-none transition-colors placeholder:text-ink-faint focus:border-indigo`;

export default function AddArticleForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [step, setStep] = useState('');

  function handleSave() {
    if (!title.trim() || !step.trim()) return;
    onSave({ title: title.trim(), cat, step: step.trim() });
  }

  return (
    <div className="mb-[18px] rounded-m border border-line bg-surface p-[18px] shadow-card">
      <div className="mb-2.5 flex flex-wrap gap-2.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อบทความ"
          className={`${CONTROL} min-w-[180px] flex-[2]`}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={`${CONTROL} min-w-[140px] flex-1`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={step}
        onChange={(e) => setStep(e.target.value)}
        placeholder="วิธีแก้ไข (พิมพ์เป็นขั้นตอนแรก)"
        className={`${CONTROL} mb-2.5 min-h-[60px] w-full resize-y`}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button onClick={handleSave} disabled={!title.trim() || !step.trim()}>
          บันทึกบทความ
        </Button>
      </div>
    </div>
  );
}
