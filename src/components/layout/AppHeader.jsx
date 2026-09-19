'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_META } from '@/lib/data';
import { navItemsForRole } from '@/lib/nav';
import { useApp } from '@/lib/store';
import Pill from '@/components/ui/Pill';

/** Role badge colours — the design tints admin pink and agent mint. */
const ROLE_BADGE = {
  employee: 'bg-indigo-soft text-indigo-dark',
  agent: 'bg-mint-soft text-[#0D6D64]',
  admin: 'bg-[#FDE3EC] text-[#C22B62]',
};

export default function AppHeader() {
  const { currentUser, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) return null;

  const items = navItemsForRole(currentUser.role, pathname);

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div
        className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-5 px-6 py-4
          max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2.5"
      >
        <div className="flex min-w-0 items-center gap-7 max-[600px]:w-full max-[600px]:gap-4">
          <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">SmartDesk</span>
          {/* Scrolls rather than wrapping when the labels outgrow a phone. */}
          <nav className="flex min-w-0 gap-6 overflow-x-auto max-[600px]:gap-4">
            {items.map((item) => (
              <Link
                key={item.v}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`border-b-2 py-1.5 text-md2 font-semibold whitespace-nowrap transition-colors ${
                  item.active
                    ? 'border-indigo text-ink'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-[18px] text-base">
          <div className="flex flex-col items-end gap-[3px] max-[600px]:items-start">
            <span className="font-semibold text-ink">{currentUser.name}</span>
            <Pill
              className={`px-[9px] py-[3px] text-2xs tracking-[0.02em] ${ROLE_BADGE[currentUser.role]}`}
            >
              {ROLE_META[currentUser.role].label}
            </Pill>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer border-none bg-transparent text-base font-semibold
              text-ink-soft hover:text-indigo-dark hover:underline"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
