import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// Self-service "forgot password" — identity is proven only by knowing the
// username, since there's no emailed-link flow yet (see password_reset_tokens
// in database/01_schema.sql for where that would plug in).
export async function POST(req) {
  const { username, newPassword } = await req.json();

  if (!username || !newPassword) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
  }

  const existing = await prisma.users.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' }, { status: 404 });
  }

  const pwdHash = await hashPassword(newPassword);
  await prisma.users.update({
    where: { id: existing.id },
    data: { pwd_hash: pwdHash },
  });

  return NextResponse.json({ ok: true });
}
