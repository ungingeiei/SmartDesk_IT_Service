'use client';

import { matchKB } from '@/lib/logic';
import { useApp } from '@/lib/store';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import KbCard from '@/components/kb/KbCard';
import IssueChips from '@/components/tickets/IssueChips';
import { SearchIcon } from '@/components/icons';

/**
 * Stage 1 of the wizard: nudge the employee to solve it themselves first.
 * Opening a result counts as a deflection, which feeds the admin dashboard.
 */
export default function TicketSearchStage({ query, onQueryChange, onOpenForm }) {
  const { kb, incrementDeflected } = useApp();

  const trimmed = query.trim();
  const results = trimmed ? matchKB(kb, trimmed, []) : [];
  const quickIssues = kb.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-[70px]">
      <div className="mx-auto max-w-[760px] pt-11 pb-5 text-center">
        <Pill tone="mint" className="mb-[22px] px-4 py-2 text-sm2">
          ค้นหาด้วยตัวเองก่อนเปิด ticket
        </Pill>
        <h1 className="mb-3 text-[42px] font-extrabold tracking-[-0.02em] max-[600px]:text-[28px]">
          มีปัญหาอะไรให้เราช่วย?
        </h1>
        <p className="mb-[30px] text-lg2 text-ink-soft">
          พิมพ์อธิบายปัญหา แล้วเราจะค้นหาวิธีแก้ไขให้ทันที
        </p>

        <SearchBar
          variant="box"
          value={query}
          onChange={onQueryChange}
          placeholder="อธิบายปัญหาที่พบ..."
          autoFocus
        />

        <div className="mt-[30px] mb-3.5 text-base font-semibold text-ink-faint">ปัญหาที่พบบ่อย</div>
        <IssueChips
          issues={quickIssues}
          activeTitle={query}
          // Tapping the active chip clears it again, as in the design.
          onPick={(issue) => onQueryChange(query === issue.title ? '' : issue.title)}
        />
      </div>

      {trimmed ? (
        <div className="mx-auto mt-9 w-full max-w-[1000px]">
          {results.length > 0 ? (
            <>
              <div className="mb-4 text-center text-lg font-bold">
                พบ {results.length} บทความที่อาจช่วยได้
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {results.map((article) => (
                  <KbCard
                    key={article.id}
                    article={article}
                    query={trimmed}
                    compact
                    onClick={incrementDeflected}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={<SearchIcon size={34} />} title={`ไม่พบบทความที่ตรงกับ "${trimmed}"`} />
          )}
        </div>
      ) : null}

      <div className="mx-auto mt-8 max-w-[520px] text-center">
        <p className="mb-3.5 text-md2 text-ink-soft">ไม่พบบทความที่ต้องการใช่ไหม</p>
        <Button onClick={onOpenForm}>แจ้งปัญหาให้ทีม IT ช่วยดู</Button>
      </div>
    </div>
  );
}
