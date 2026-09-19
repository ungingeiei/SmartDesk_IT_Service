'use client';

import Link from 'next/link';
import { useApp } from '@/lib/store';
import { ChatIcon } from '@/components/icons';

/**
 * Floating "report a problem" button, employees only.
 *
 * The handoff file still computes `showFab`/`fabHelp` but its markup slot is
 * empty — fixed-position elements do not survive the design tool — so this is
 * restored from the original prototype.
 */
export default function HelpFab() {
  const { currentUser } = useApp();
  if (!currentUser || currentUser.role !== 'employee') return null;

  return (
    <Link
      href="/tickets/new"
      title="แจ้งปัญหาใหม่"
      aria-label="แจ้งปัญหาใหม่"
      className="fixed right-[26px] bottom-[26px] z-30 flex h-13 w-13 items-center justify-center
        rounded-full bg-indigo text-white shadow-fab transition-colors hover:bg-indigo-dark"
    >
      <ChatIcon size={22} />
    </Link>
  );
}
