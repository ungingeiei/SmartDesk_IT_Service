// Server-only. Who may see and review KB articles.
//
// Articles from employees / IT Support start as 'pending' and stay hidden from
// everyone except their author until a หัวหน้าทีม IT (role 'admin') approves
// them. An admin's own articles are published straight away.

import prisma from './prisma';

/** The user row for `userId`, or null when it is missing or unknown. */
export async function findUser(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.users.findUnique({ where: { id }, select: { id: true, role: true } });
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Prisma `where` for the articles `viewer` may see: every approved article,
 * plus all pending ones for an admin, plus the viewer's own unapproved ones.
 */
export function visibleArticlesWhere(viewer) {
  if (isAdmin(viewer)) {
    return { OR: [{ status: 'approved' }, { status: 'pending' }, { created_by: viewer.id }] };
  }
  if (viewer) {
    return { OR: [{ status: 'approved' }, { created_by: viewer.id }] };
  }
  return { status: 'approved' };
}
