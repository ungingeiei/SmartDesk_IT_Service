import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
  }

  const invalidCredentials = () =>
    NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });

  const user = await prisma.users.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!user) return invalidCredentials();

  if (user.locked_until && user.locked_until > new Date()) {
    return NextResponse.json(
      { error: 'บัญชีนี้ถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง' },
      { status: 423 }
    );
  }

  const ok = await verifyPassword(password, user.pwd_hash);
  if (!ok) return invalidCredentials();

  await prisma.users.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      code: user.employee_code,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      title: user.title,
    },
  });
}
