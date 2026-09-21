'use client';

// No backend/email exists yet, so this resets the password directly by
// username instead of the emailed-link flow database/01_schema.sql's
// password_reset_tokens table is meant for.

import { useState } from 'react';
import { useApp } from '@/lib/store';
import Button from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';

export default function ForgotPasswordModal({ open, onClose }) {
  const { users, resetPassword } = useApp();
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  function handleClose() {
    setUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();

    const idx = users.findIndex(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (idx === -1) {
      setError('ไม่พบชื่อผู้ใช้นี้ในระบบ');
      return;
    }
    if (newPassword.length < 4) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    resetPassword(idx, newPassword);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="ตั้งรหัสผ่านใหม่">
      <form onSubmit={handleSubmit} noValidate>
        <Field label="ชื่อผู้ใช้">
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="เช่น somying"
            autoComplete="username"
            autoFocus
          />
        </Field>

        <Field label="รหัสผ่านใหม่">
          <TextInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
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
          <Button type="submit">บันทึกรหัสผ่านใหม่</Button>
        </div>
      </form>
    </Modal>
  );
}
