'use client';

import { useEffect, useRef } from 'react';
import { ROLE_BADGE, ROLE_META, USER_STATUS_META } from '@/lib/data';
import { initialOf } from '@/lib/logic';
import Avatar from '@/components/ui/Avatar';
import Pill from '@/components/ui/Pill';

const TH = 'px-4 py-3 text-left text-sm2 font-bold text-ink-soft';
const TD = 'px-4 py-3.5 align-middle text-md text-ink';

export default function UserTable({ users, selected, currentUserCode, onToggle, onToggleAll, onEdit }) {
  const selectable = users.filter((u) => u.code !== currentUserCode);
  const selectedCount = selectable.filter((u) => selected.has(u.code)).length;
  const allChecked = selectable.length > 0 && selectedCount === selectable.length;

  // "indeterminate" exists only as a DOM property, not an attribute.
  const headerBox = useRef(null);
  useEffect(() => {
    if (headerBox.current) {
      headerBox.current.indeterminate = selectedCount > 0 && !allChecked;
    }
  }, [selectedCount, allChecked]);

  return (
    <div className="overflow-x-auto rounded-m border border-line bg-surface shadow-card">
      <table className="w-full min-w-[820px] border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <th scope="col" className="w-12 py-3 pr-0 pl-4">
              <input
                ref={headerBox}
                type="checkbox"
                checked={allChecked}
                disabled={selectable.length === 0}
                onChange={() => onToggleAll(!allChecked)}
                aria-label="เลือกผู้ใช้ทั้งหมดที่แสดงอยู่"
                className="h-4 w-4 cursor-pointer"
              />
            </th>
            <th scope="col" className={TH}>อีเมล / รหัสพนักงาน</th>
            <th scope="col" className={TH}>ชื่อ-นามสกุล</th>
            <th scope="col" className={TH}>ตำแหน่ง</th>
            <th scope="col" className={TH}>บทบาท</th>
            <th scope="col" className={TH}>สถานะ</th>
            <th scope="col" className="w-20 px-4 py-3">
              <span className="sr-only">การดำเนินการ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.code === currentUserCode;
            const status = USER_STATUS_META[user.status];
            return (
              <tr
                key={user.code}
                className="border-b border-line last:border-b-0 hover:bg-surface-alt/60"
              >
                <td className="py-3.5 pr-0 pl-4">
                  <input
                    type="checkbox"
                    checked={selected.has(user.code)}
                    disabled={isSelf}
                    onChange={() => onToggle(user.code)}
                    aria-label={`เลือก ${user.name}`}
                    title={isSelf ? 'ไม่สามารถเลือกบัญชีของตัวเองได้' : undefined}
                    className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>
                <td className={TD}>
                  <div className="font-semibold">{user.email}</div>
                  <div className="font-mono text-xs2 text-ink-faint">{user.code}</div>
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <Avatar initial={initialOf(user.name)} size={32} />
                    <span>
                      {user.name}
                      {isSelf ? <span className="ml-1.5 text-xs2 text-ink-faint">(คุณ)</span> : null}
                    </span>
                  </div>
                </td>
                <td className={`${TD} text-ink-soft`}>{user.title || '—'}</td>
                <td className={TD}>
                  <Pill className={`px-2.5 py-[3px] text-xs2 ${ROLE_BADGE[user.role]}`}>
                    {ROLE_META[user.role].label}
                  </Pill>
                </td>
                <td className={TD}>
                  <Pill tone={status.tone} className="px-2.5 py-[3px] text-xs2">
                    {status.label}
                  </Pill>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(user.code)}
                    aria-label={`แก้ไข ${user.name}`}
                    className="cursor-pointer border-none bg-transparent p-0 text-md font-semibold
                      text-indigo hover:text-indigo-dark hover:underline"
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
