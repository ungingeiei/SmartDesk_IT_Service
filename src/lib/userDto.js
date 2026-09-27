// Server-only shape shared by the admin user-management API routes.

export const USER_SAFE_SELECT = {
  id: true,
  employee_code: true,
  name: true,
  username: true,
  email: true,
  role: true,
  title: true,
  locked_until: true,
  last_login_at: true,
  created_at: true,
};

// The schema only has a timestamp for a lockout, not a boolean, so a manual
// admin lock (as opposed to an automatic failed-login lockout) is represented
// as "locked until the far future".
export const INDEFINITE_LOCK = new Date('2999-12-31T00:00:00Z');

/** Reshapes a DB row into the { code, status } shape src/lib/data.js's mock USERS used. */
export function toUserDTO(u) {
  const { employee_code, locked_until, ...rest } = u;
  return {
    ...rest,
    code: employee_code,
    status: locked_until && new Date(locked_until) > new Date() ? 'locked' : 'active',
  };
}
