'use client';

// Username/password login. There's no backend, so this checks credentials
// against the mock USERS list and routes by role — see homeHrefForRole().

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { homeHrefForRole } from '@/lib/nav';
import { useApp } from '@/lib/store';
import Button from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginForm() {
  const { users, login } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    const idx = users.findIndex(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (idx === -1 || users[idx].password !== password) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    setError('');
    login(idx);
    router.push(homeHrefForRole(users[idx].role));
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-m border border-line bg-surface p-6 shadow-card"
        noValidate
      >
        <Field label="ชื่อผู้ใช้">
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="เช่น somying"
            autoComplete="username"
            autoFocus
          />
        </Field>

        <Field label="รหัสผ่าน">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <div className="mb-[18px] rounded-s bg-critical-soft px-3.5 py-2.5 text-sm2 font-semibold text-critical">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full">
          เข้าสู่ระบบ
        </Button>

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="mt-3.5 block w-full cursor-pointer text-center text-sm2 font-semibold
            text-indigo-dark hover:underline"
        >
          ลืมรหัสผ่าน?
        </button>
      </form>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
