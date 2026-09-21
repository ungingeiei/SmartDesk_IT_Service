'use client';

import { useState } from 'react';
import { Field, TextInput } from '@/components/ui/Field';
import { generatePassword, PASSWORD_MIN_LENGTH } from '@/lib/users';

const LINK_BUTTON =
  'cursor-pointer border-none bg-transparent p-0 text-sm2 font-semibold text-indigo-dark hover:underline';

/**
 * Password input for the IT lead. Shown as plain text by default: the admin is *setting*
 * a temporary password they must hand to someone, not typing a secret of their own.
 */
export default function PasswordField({ id, label, value, onChange, error, hint }) {
  const [visible, setVisible] = useState(true);

  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={hint ?? `อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร มีทั้งตัวอักษรและตัวเลข`}
    >
      <TextInput
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        autoComplete="new-password"
        spellCheck={false}
        className="font-mono"
      />
      <div className="mt-2 flex gap-4">
        <button type="button" className={LINK_BUTTON} onClick={() => onChange(generatePassword())}>
          สุ่มรหัสผ่าน
        </button>
        <button type="button" className={LINK_BUTTON} onClick={() => setVisible((v) => !v)}>
          {visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        </button>
      </div>
    </Field>
  );
}
