'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { homeHrefForRole, rolesForPath } from '@/lib/nav';
import { useApp } from '@/lib/store';

/**
 * Client-side route guard.
 *
 * Auth is in-memory demo state (restored from localStorage on load), so this
 * cannot run on the server: signed-out visitors are sent to the login screen,
 * and anyone opening a route their role has no tab for (an employee typing
 * /dashboard) is sent to their own home.
 */
export default function RequireAuth({ children }) {
  const { currentUser, authReady } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const allowedRoles = rolesForPath(pathname);
  const allowed = currentUser && (!allowedRoles || allowedRoles.includes(currentUser.role));

  useEffect(() => {
    // Don't redirect until the localStorage session check has actually run —
    // otherwise every refresh bounces a signed-in user back to the login page.
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    } else if (!allowed) {
      router.replace(homeHrefForRole(currentUser.role));
    }
  }, [authReady, currentUser, allowed, router]);

  if (!authReady || !allowed) return null;
  return children;
}
