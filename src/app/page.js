'use client';

import { useRouter } from 'next/navigation';
import { ROLE_META, USER_STATUS_META } from '@/lib/data';
import { homeHrefForRole } from '@/lib/nav';
import { initialOf } from '@/lib/logic';
import { useApp } from '@/lib/store';
import Avatar from '@/components/ui/Avatar';
import Pill from '@/components/ui/Pill';
import { ChevronRightIcon } from '@/components/icons';

export default function LoginPage() {
  const { login, users } = useApp();
  const router = useRouter();

  function handleLogin(index) {
    login(index);
    router.push(homeHrefForRole(users[index].role));
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-15">
      <div className="w-full max-w-[560px]">
        <h1 className="mb-1.5 text-center text-[30px] font-extrabold tracking-[-0.02em]">
          SmartDesk
        </h1>
        <div className="mb-8 text-center text-md2 text-ink-soft">
          เข้าสู่ระบบเพื่อดูมุมมองของแต่ละบทบาท
        </div>

        <div className="flex flex-col gap-3">
          {users.map((user, index) => {
            const locked = user.status === 'locked';
            return (
              <button
                key={user.code}
                type="button"
                disabled={locked}
                onClick={() => handleLogin(index)}
                className="flex cursor-pointer items-center gap-3.5 rounded-m border border-line
                  bg-surface px-[18px] py-4 text-left shadow-card transition
                  hover:-translate-y-px hover:border-indigo hover:shadow-soft active:scale-[0.97]
                  disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0
                  disabled:hover:border-line disabled:hover:shadow-card disabled:active:scale-100"
              >
                <Avatar initial={initialOf(user.name)} size={44} className="font-extrabold" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-ink">{user.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-sm2 text-ink-faint">
                    {user.title}
                    <Pill tone="category" className="px-[9px] py-[3px] text-2xs">
                      {ROLE_META[user.role].label}
                    </Pill>
                    {locked ? (
                      <Pill tone={USER_STATUS_META.locked.tone} className="px-[9px] py-[3px] text-2xs">
                        {USER_STATUS_META.locked.label}
                      </Pill>
                    ) : null}
                  </span>
                </span>
                <ChevronRightIcon size={18} className="shrink-0 text-ink-faint" />
              </button>
            );
          })}
        </div>

        <div className="mt-[22px] text-center text-sm text-ink-faint">
          โหมดสาธิต — เลือกผู้ใช้เพื่อดูว่าแต่ละบทบาทเห็นข้อมูลต่างกันอย่างไร ไม่ต้องใช้รหัสผ่าน
        </div>
      </div>
    </div>
  );
}