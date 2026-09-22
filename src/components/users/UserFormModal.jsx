'use client';

import { useState } from 'react';
import { ROLE_META, USER_STATUS_META } from '@/lib/data';
import { validateUserForm } from '@/lib/users';
import Button from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import OptionCard from '@/components/ui/OptionCard';
import PasswordField from '@/components/users/PasswordField';

const ROLE_ORDER = ['employee', 'agent', 'admin'];

/** What each role can reach — mirrors ROLES_BY_PREFIX in lib/nav.js. */
const ROLE_ABILITY = {
  employee: 'แจ้งปัญหา ดู ticket ของตัวเอง และอ่านคลังความรู้',
  agent: 'รับและแก้ไข ticket ในคิวงาน และอ่านคลังความรู้',
  admin: 'ดูแดชบอร์ด ดู ticket ทั้งหมด และจัดการผู้ใช้',
};

/**
 * One form for both flows. `user` present = edit, absent = add.
 * `isSelf` locks role and status so the signed-in lead cannot demote or lock themselves out.
 */
export default function UserFormModal({ user, users, isSelf, onSubmit, onClose, onResetPassword }) {
  const isEdit = Boolean(user);
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    code: user?.code ?? '',
    title: user?.title ?? '',
    role: user?.role ?? 'employee',
    status: user?.status ?? 'active',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  function handleSubmit(e) {
    e.preventDefault();
    const others = users.filter((u) => u.code !== user?.code);
    const found = validateUserForm(values, others, { requirePassword: !isEdit });
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(values);
  }

  return (
    <Modal title={isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="ชื่อ-นามสกุล" htmlFor="user-name" error={errors.name}>
          <TextInput
            id="user-name"
            value={values.name}
            onChange={(e) => set('name')(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            autoFocus
          />
        </Field>

        <Field label="อีเมล" htmlFor="user-email" error={errors.email}>
          <TextInput
            id="user-email"
            type="email"
            value={values.email}
            onChange={(e) => set('email')(e.target.value)}
            placeholder="name@smartdesk.co.th"
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1">
          <Field
            label="รหัสพนักงาน"
            htmlFor="user-code"
            error={errors.code}
            hint={isEdit ? 'เปลี่ยนรหัสพนักงานไม่ได้' : undefined}
          >
            <TextInput
              id="user-code"
              value={values.code}
              onChange={(e) => set('code')(e.target.value)}
              placeholder="เช่น EMP-301"
              disabled={isEdit}
              aria-invalid={errors.code ? true : undefined}
            />
          </Field>
          <Field label="ตำแหน่ง" htmlFor="user-title">
            <TextInput
              id="user-title"
              value={values.title}
              onChange={(e) => set('title')(e.target.value)}
              placeholder="เช่น IT Support"
            />
          </Field>
        </div>

        <Field
          label="บทบาท"
          hint={isSelf ? 'เปลี่ยนบทบาทของตัวเองไม่ได้' : ROLE_ABILITY[values.role]}
        >
          <div className="grid grid-cols-3 gap-2.5 max-[600px]:grid-cols-1">
            {ROLE_ORDER.map((role) => (
              <OptionCard
                key={role}
                selected={values.role === role}
                disabled={isSelf}
                onClick={() => set('role')(role)}
              >
                {ROLE_META[role].label}
              </OptionCard>
            ))}
          </div>
        </Field>

        {isEdit ? (
          <Field
            label="สถานะบัญชี"
            hint={
              isSelf
                ? 'ล็อกบัญชีของตัวเองไม่ได้'
                : values.status === 'locked'
                  ? 'ผู้ใช้ที่ถูกล็อกจะเข้าสู่ระบบไม่ได้จนกว่าจะปลดล็อก'
                  : undefined
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(USER_STATUS_META).map(([status, meta]) => (
                <OptionCard
                  key={status}
                  selected={values.status === status}
                  disabled={isSelf}
                  onClick={() => set('status')(status)}
                >
                  {meta.label}
                </OptionCard>
              ))}
            </div>
          </Field>
        ) : (
          <PasswordField
            id="user-password"
            label="รหัสผ่านชั่วคราว"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
            hint="แจ้งรหัสผ่านนี้ให้ผู้ใช้ด้วยตนเอง — จะไม่แสดงอีกหลังบันทึก"
          />
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2.5">
          {isEdit ? (
            <button
              type="button"
              onClick={onResetPassword}
              className="cursor-pointer border-none bg-transparent p-0 text-md font-semibold
                text-indigo-dark hover:underline"
            >
              รีเซ็ตรหัสผ่าน
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit">{isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
