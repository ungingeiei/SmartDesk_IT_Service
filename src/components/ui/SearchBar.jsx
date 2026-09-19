'use client';

import { SearchIcon } from '@/components/icons';

/**
 * Two shapes in the design:
 *  - `pill`: the rounded knowledge-base hero search, with a clear button and a
 *    trailing action button.
 *  - `box`: the larger rounded-rectangle search on the self-service stage of the
 *    ticket wizard, which focuses mint rather than indigo.
 */
export default function SearchBar({
  variant = 'pill',
  value,
  onChange,
  onClear,
  placeholder,
  action,
  autoFocus,
}) {
  const isPill = variant === 'pill';

  return (
    <div
      className={
        isPill
          ? 'mx-auto flex max-w-[640px] items-center gap-2.5 rounded-full border border-line bg-surface p-1.5 pl-5 shadow-soft'
          : 'flex items-center gap-3 rounded-m border-[1.5px] border-line bg-surface p-2 pl-[22px] shadow-soft focus-within:border-mint'
      }
    >
      <SearchIcon size={isPill ? 20 : 22} className="shrink-0 text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`min-w-0 flex-1 border-none bg-transparent text-ink outline-none
          placeholder:text-ink-faint ${
            isPill ? 'py-[13px] text-lg2' : 'py-4 text-[18px] max-[600px]:py-[13px] max-[600px]:text-base'
          }`}
      />
      {isPill && value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="ล้างคำค้นหา"
          className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-none bg-surface-alt
            text-md text-ink-soft hover:text-ink"
        >
          ×
        </button>
      ) : null}
      {action}
    </div>
  );
}
