// Maps the design's view keys onto real URLs, and reproduces its active-tab rules.

import { NAV } from './data';

export const HREF_BY_VIEW = {
  kb: '/kb',
  newTicket: '/tickets/new',
  ticketList: '/tickets',
  queue: '/queue',
  dashboard: '/dashboard',
};

/** Which roles may open a given path. Used by the authenticated layout's guard. */
export const ROLES_BY_PREFIX = [
  ['/dashboard', ['admin']],
  ['/queue', ['agent', 'admin']],
  ['/tickets', ['employee']],
  ['/kb', ['employee', 'agent', 'admin']],
];

export function rolesForPath(pathname) {
  const match = ROLES_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : null;
}

/** Where a role lands after logging in — the first tab of its navigation. */
export function homeHrefForRole(role) {
  const first = (NAV[role] || [])[0];
  return first ? HREF_BY_VIEW[first.v] : '/kb';
}

/**
 * A tab stays highlighted on its detail pages: /kb on /kb/[id], /tickets on
 * /tickets/[id] but *not* on /tickets/new, /queue on /queue/[id].
 */
export function isActive(pathname, view) {
  switch (view) {
    case 'kb':
      return pathname === '/kb' || pathname.startsWith('/kb/');
    case 'ticketList':
      return pathname === '/tickets' || /^\/tickets\/(?!new$)/.test(pathname);
    case 'newTicket':
      return pathname === '/tickets/new';
    case 'queue':
      return pathname === '/queue' || pathname.startsWith('/queue/');
    case 'dashboard':
      return pathname === '/dashboard';
    default:
      return false;
  }
}

/** Navigation items for a role, ready to render as links. */
export function navItemsForRole(role, pathname) {
  return (NAV[role] || []).map((item) => ({
    ...item,
    href: HREF_BY_VIEW[item.v],
    active: isActive(pathname, item.v),
  }));
}
