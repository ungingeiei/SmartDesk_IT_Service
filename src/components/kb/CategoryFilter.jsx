'use client';

import { CATEGORIES } from '@/lib/data';

export default function CategoryFilter({ active, onToggle, onClear }) {
  return (
    <aside className="rounded-m border border-line bg-surface p-5 shadow-card">
      <h4 className="mb-3 text-sm2 tracking-[0.04em] text-ink-faint uppercase">หมวดหมู่</h4>
      {CATEGORIES.map((cat) => (
        <label
          key={cat}
          className="flex cursor-pointer items-center gap-[9px] py-1.5 text-md text-ink-soft hover:text-ink"
        >
          <input
            type="checkbox"
            checked={active.includes(cat)}
            onChange={() => onToggle(cat)}
            className="h-4 w-4 cursor-pointer"
          />
          {cat}
        </label>
      ))}
      {active.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3.5 cursor-pointer border-none bg-transparent p-0 text-sm2
            font-semibold text-indigo hover:underline"
        >
          ล้างตัวกรอง
        </button>
      ) : null}
    </aside>
  );
}
