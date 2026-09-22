'use client';

// Username/password login against the real users table via /api/auth/login.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { homeHrefForRole } from '@/lib/nav';
import { useApp } from '@/lib/store';
import Button from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginForm() {
  const { login } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      login(data.user);
      router.push(homeHrefForRole(data.user.role));
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
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
            placeholder="เช่น emp256"
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

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
