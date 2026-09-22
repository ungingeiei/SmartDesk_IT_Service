import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
  }

  const invalidCredentials = () =>
    NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });

  const result = await pool.query(
    `SELECT "id", "employee_code", "name", "username", "email", "pwd_hash", "role", "title", "locked_until"
     FROM "users" WHERE "username" = $1`,
    [username.trim().toLowerCase()]
  );
  const row = result.rows[0];

  if (!row) return invalidCredentials();

  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    return NextResponse.json(
      { error: 'บัญชีนี้ถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง' },
      { status: 423 }
    );
  }

  const ok = await verifyPassword(password, row.pwd_hash);
  if (!ok) return invalidCredentials();

  await pool.query('UPDATE "users" SET "last_login_at" = now() WHERE "id" = $1', [row.id]);

  return NextResponse.json({
    user: {
      id: row.id,
      code: row.employee_code,
      name: row.name,
      username: row.username,
      email: row.email,
      role: row.role,
      title: row.title,
    },
  });
}
