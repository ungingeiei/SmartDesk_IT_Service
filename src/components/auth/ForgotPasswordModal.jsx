'use client';

// Self-service reset via /api/auth/reset-password. Identity is proven only by
// knowing the username, since there's no emailed-link flow yet — see
// password_reset_tokens in database/01_schema.sql for where that would plug in.

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { validatePassword } from '@/lib/users';
import Button from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';

export default function ForgotPasswordModal({ open, onClose }) {
  const { showToast } = useApp();
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้');
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
        return;
      }

      showToast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      handleClose();
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="ตั้งรหัสผ่านใหม่">
      <form onSubmit={handleSubmit} noValidate>
        <Field label="ชื่อผู้ใช้">
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="เช่น emp256"
            autoComplete="username"
            autoFocus
          />
        </Field>

        <Field label="รหัสผ่านใหม่">
          <TextInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข"
            autoComplete="new-password"
          />
        </Field>

        <Field label="ยืนยันรหัสผ่านใหม่">
          <TextInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <div className="mb-[18px] rounded-s bg-critical-soft px-3.5 py-2.5 text-sm2 font-semibold text-critical">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
