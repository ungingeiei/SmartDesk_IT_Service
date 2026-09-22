'use client';

import { useState } from 'react';
import { validatePassword } from '@/lib/users';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PasswordField from '@/components/users/PasswordField';

/** Sets a new password for someone else. No "current password" — the IT lead is overriding it. */
export default function ResetPasswordModal({ user, onSubmit, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const found = validatePassword(password);
    setError(found);
    if (!found) onSubmit(password);
  }

  return (
    <Modal title="รีเซ็ตรหัสผ่าน" onClose={onClose}>
      <p className="mt-0 mb-5 text-md text-ink-soft">
        ตั้งรหัสผ่านใหม่ให้ <strong className="text-ink">{user.name}</strong> ({user.email})
        รหัสผ่านเดิมจะใช้ไม่ได้ทันที
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="reset-password"
          label="รหัสผ่านใหม่"
          value={password}
          onChange={setPassword}
          error={error}
          hint="แจ้งรหัสผ่านนี้ให้ผู้ใช้ด้วยตนเอง — จะไม่แสดงอีกหลังบันทึก"
        />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit">ตั้งรหัสผ่านใหม่</Button>
        </div>
      </form>
    </Modal>
  );
}
