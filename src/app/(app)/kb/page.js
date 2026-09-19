'use client';

import { useState } from 'react';
import { matchKB } from '@/lib/logic';
import { useApp } from '@/lib/store';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import KbCard from '@/components/kb/KbCard';
import CategoryFilter from '@/components/kb/CategoryFilter';
import ContributorsCard from '@/components/kb/ContributorsCard';
import AddArticleForm from '@/components/kb/AddArticleForm';
import CtaBand from '@/components/kb/CtaBand';
import { SearchIcon } from '@/components/icons';

export default function KnowledgeBasePage() {
  const { kb, currentUser, addArticle } = useApp();

  // Search text and filters are view state, so they live here rather than in the store.
  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState([]);
  const [showAddArticle, setShowAddArticle] = useState(false);

  const results = matchKB(kb, query, activeCats);

  function toggleCat(cat) {
    setActiveCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function handleSave(article) {
    addArticle(article);
    setShowAddArticle(false);
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-[70px]">
      <div className="pt-11 pb-[30px] text-center">
        <h1 className="mb-5 text-[42px] font-extrabold tracking-[-0.02em] text-ink max-[600px]:text-[30px]">
          คลังความรู้
        </h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="ค้นหาบทความ..."
          action={
            <button
              type="button"
              onClick={() => setShowAddArticle((v) => !v)}
              className="shrink-0 cursor-pointer rounded-full border-none bg-indigo px-5 py-3
                text-base font-bold whitespace-nowrap text-white transition-colors hover:bg-indigo-dark"
            >
              เพิ่มบทความใหม่
            </button>
          }
        />
      </div>

      <div className="flex items-start gap-[26px] max-[820px]:flex-col">
        <div
          className="sticky top-[88px] flex w-[230px] shrink-0 flex-col gap-5
            max-[820px]:static max-[820px]:w-full"
        >
          <CategoryFilter
            active={activeCats}
            onToggle={toggleCat}
            onClear={() => setActiveCats([])}
          />
          <ContributorsCard />
        </div>

        <div className="min-w-0 flex-1">
          {showAddArticle ? (
            <AddArticleForm onSave={handleSave} onCancel={() => setShowAddArticle(false)} />
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.01em]">บทความและเวิร์กช็อป</h2>
            <span className="text-base text-ink-faint">{results.length} บทความ</span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
              {results.map((article) => (
                <KbCard key={article.id} article={article} query={query} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<SearchIcon size={34} />}
              title="ไม่พบบทความที่ตรงกับเงื่อนไข"
              hint="ลองค้นหาด้วยคำอื่น หรือแจ้งปัญหาให้ทีม IT ช่วยดูให้เลย"
            />
          )}

          {currentUser?.role === 'employee' ? <CtaBand /> : null}
        </div>
      </div>
    </div>
  );
}
