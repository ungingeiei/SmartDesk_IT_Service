import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Self-service "forgot password" — identity is proven only by knowing the
// username, since there's no emailed-link flow yet (see password_reset_tokens
// in database/01_schema.sql for where that would plug in).
export async function POST(req) {
  const { username, newPassword } = await req.json();

  if (!username || !newPassword) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
  }

  const existing = await pool.query('SELECT "id" FROM "users" WHERE "username" = $1', [
    username.trim().toLowerCase(),
  ]);
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' }, { status: 404 });
  }

  const pwdHash = await hashPassword(newPassword);
  await pool.query('UPDATE "users" SET "pwd_hash" = $1 WHERE "id" = $2', [
    pwdHash,
    existing.rows[0].id,
  ]);

  return NextResponse.json({ ok: true });
}
