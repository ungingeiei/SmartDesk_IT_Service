import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { USER_SAFE_SELECT, INDEFINITE_LOCK, toUserDTO } from '@/lib/userDto';

/** "แก้ไขผู้ใช้" and lock/unlock — both just patch fields on one user row. */
export async function PATCH(req, { params }) {
  const { code } = await params;
  const body = await req.json();

  const data = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email.trim().toLowerCase();
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.role !== undefined) data.role = body.role;
  if (body.status !== undefined) {
    data.locked_until = body.status === 'locked' ? INDEFINITE_LOCK : null;
  }

  try {
    const updated = await prisma.users.update({
      where: { employee_code: code },
      data,
      select: USER_SAFE_SELECT,
    });
    return NextResponse.json(toUserDTO(updated));
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });
    }
    throw err;
  }
}
