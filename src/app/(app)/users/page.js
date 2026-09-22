'use client';

import { useState } from 'react';
import { ROLE_META, USER_STATUS_META } from '@/lib/data';
import { filterUsers, usersToCsv } from '@/lib/users';
import { useApp } from '@/lib/store';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SelectInput } from '@/components/ui/Field';
import PageHeading from '@/components/ui/PageHeading';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import UserFormModal from '@/components/users/UserFormModal';
import UserTable from '@/components/users/UserTable';
import { DownloadIcon, PlusIcon, SearchIcon } from '@/components/icons';

const ROLE_FILTERS = [
  { v: 'all', label: 'ทั้งหมด' },
  ...Object.entries(ROLE_META).map(([v, meta]) => ({ v, label: meta.label })),
];

export default function UsersPage() {
  const { users, currentUser, addUser, updateUser, setUsersStatus, resetPassword } = useApp();

  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  // null | { mode: 'add' } | { mode: 'edit' | 'password', code }
  const [dialog, setDialog] = useState(null);

  const visible = filterUsers(users, { query, role, status });
  const lockedCount = users.filter((u) => u.status === 'locked').length;
  const picked = visible.filter((u) => selected.has(u.code));
  const target = dialog?.code ? users.find((u) => u.code === dialog.code) : null;

  // Changing what is visible would leave ticks on rows the admin can no longer see.
  function withClearedSelection(setter) {
    return (value) => {
      setter(value);
      setSelected(new Set());
    };
  }

  function toggleOne(code) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll(checked) {
    setSelected(
      checked
        ? new Set(visible.filter((u) => u.code !== currentUser.code).map((u) => u.code))
        : new Set(),
    );
  }

  function bulkStatus(next) {
    setUsersStatus(
      picked.map((u) => u.code),
      next,
    );
    setSelected(new Set());
  }

  function exportCsv() {
    // The BOM makes Excel read the Thai text as UTF-8.
    const blob = new Blob(['\uFEFF' + usersToCsv(visible)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smartdesk-users.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-[70px]">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <PageHeading
          title="จัดการผู้ใช้"
          subtitle={`${users.length} บัญชี · ถูกล็อก ${lockedCount}`}
        />
        <Button onClick={() => setDialog({ mode: 'add' })} className="mb-1.5">
          <PlusIcon size={16} strokeWidth={2.6} />
          เพิ่มผู้ใช้
        </Button>
      </div>

      <div className="mt-4 mb-3 flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-s border border-line bg-surface px-3.5 focus-within:border-indigo">
          <SearchIcon size={18} className="shrink-0 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => withClearedSelection(setQuery)(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ อีเมล รหัสพนักงาน หรือตำแหน่ง"
            aria-label="ค้นหาผู้ใช้"
            className="min-w-0 flex-1 border-none bg-transparent py-[11px] text-md2 text-ink
              outline-none placeholder:text-ink-faint"
          />
        </label>
        <SelectInput
          value={status}
          onChange={(e) => withClearedSelection(setStatus)(e.target.value)}
          aria-label="กรองตามสถานะ"
          className="w-auto! bg-surface!"
        >
          <option value="all">ทุกสถานะ</option>
          {Object.entries(USER_STATUS_META).map(([v, meta]) => (
            <option key={v} value={v}>
              {meta.label}
            </option>
          ))}
        </SelectInput>
        <Button variant="neutral" onClick={exportCsv} disabled={visible.length === 0}>
          <DownloadIcon size={16} />
          ส่งออก CSV
        </Button>
      </div>

      <div className="mb-3.5 flex flex-wrap gap-2">
        {ROLE_FILTERS.map((option) => (
          <button
            key={option.v}
            type="button"
            onClick={() => withClearedSelection(setRole)(option.v)}
            aria-pressed={role === option.v}
            className={`cursor-pointer rounded-full border px-3.5 py-[7px] text-sm2 font-semibold
              transition-colors ${
                role === option.v
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-indigo'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {picked.length > 0 ? (
        <div
          role="region"
          aria-label="การดำเนินการกับผู้ใช้ที่เลือก"
          className="mb-3 flex flex-wrap items-center gap-3 rounded-m bg-indigo-soft px-[18px] py-2.5"
        >
          <span className="text-md font-semibold text-indigo-dark">เลือกแล้ว {picked.length} คน</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="neutral" onClick={() => bulkStatus('locked')}>
              ล็อกบัญชี
            </Button>
            <Button size="sm" variant="neutral" onClick={() => bulkStatus('active')}>
              ปลดล็อก
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              ยกเลิกการเลือก
            </Button>
          </div>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <UserTable
          users={visible}
          selected={selected}
          currentUserCode={currentUser.code}
          onToggle={toggleOne}
          onToggleAll={toggleAll}
          onEdit={(code) => setDialog({ mode: 'edit', code })}
        />
      ) : (
        <EmptyState
          icon={<SearchIcon size={34} />}
          title="ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"
          hint="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองบทบาทและสถานะ"
        />
      )}

      {dialog?.mode === 'add' ? (
        <UserFormModal
          users={users}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            addUser(values);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.mode === 'edit' && target ? (
        <UserFormModal
          user={target}
          users={users}
          isSelf={target.code === currentUser.code}
          onClose={() => setDialog(null)}
          onResetPassword={() => setDialog({ mode: 'password', code: target.code })}
          onSubmit={(values) => {
            updateUser(target.code, {
              name: values.name.trim(),
              email: values.email.trim().toLowerCase(),
              title: values.title.trim(),
              role: values.role,
              status: values.status,
            });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.mode === 'password' && target ? (
        <ResetPasswordModal
          user={target}
          onClose={() => setDialog(null)}
          onSubmit={() => {
            resetPassword(target);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}
