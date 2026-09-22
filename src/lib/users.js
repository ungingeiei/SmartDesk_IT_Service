// Pure helpers for the user-management screen (filtering, validation, export).
// Nothing here touches React or the store, so it can move to the API layer later.

import { ROLE_META, USER_STATUS_META } from './data';

/** Same rule the knowledge base tells employees: letters + digits, 8 or more characters. */
export const PASSWORD_MIN_LENGTH = 8;

/** Returns an error message, or '' when the password is acceptable. */
export function validatePassword(password) {
  if (!password) return 'กรุณากรอกรหัสผ่าน';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `รหัสผ่านต้องยาวอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข';
  }
  return '';
}

// Leaves out look-alikes (0/O, 1/l/I) so a password read out over the phone survives.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';

/** A random 12-character password that always satisfies `validatePassword`. */
export function generatePassword(length = 12) {
  const pool = LETTERS + DIGITS;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (n) => pool[n % pool.length]);
  // Guarantee at least one letter and one digit, at positions that vary per call.
  chars[bytes[0] % length] = LETTERS[bytes[1] % LETTERS.length];
  chars[(bytes[0] + 1 + (bytes[2] % (length - 1))) % length] = DIGITS[bytes[3] % DIGITS.length];
  return chars.join('');
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** "IT-MGR-01" -> "itmgr01", matching the seeded `username` column. */
export function usernameFromCode(code) {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Validate the add / edit form. `others` is every user except the one being edited,
 * so uniqueness checks never trip over the record itself.
 */
export function validateUserForm(values, others, { requirePassword }) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const code = values.code.trim();

  if (!name) errors.name = 'กรุณากรอกชื่อ-นามสกุล';

  if (!email) errors.email = 'กรุณากรอกอีเมล';
  else if (!isValidEmail(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  else if (others.some((u) => u.email.toLowerCase() === email)) {
    errors.email = 'อีเมลนี้ถูกใช้งานแล้ว';
  }

  if (!code) errors.code = 'กรุณากรอกรหัสพนักงาน';
  else if (!usernameFromCode(code)) errors.code = 'รหัสพนักงานต้องมีตัวอักษรภาษาอังกฤษหรือตัวเลข';
  else if (
    others.some(
      (u) =>
        u.code.toLowerCase() === code.toLowerCase() ||
        usernameFromCode(u.code) === usernameFromCode(code),
    )
  ) {
    errors.code = 'รหัสพนักงานนี้ถูกใช้งานแล้ว';
  }

  if (requirePassword) {
    const passwordError = validatePassword(values.password);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
}

/** Search box + role pills + status select, all applied together. */
export function filterUsers(users, { query, role, status }) {
  const q = query.trim().toLowerCase();
  return users.filter((u) => {
    if (role !== 'all' && u.role !== role) return false;
    if (status !== 'all' && u.status !== status) return false;
    if (!q) return true;
    return [u.name, u.email, u.code, u.title].some((field) => (field || '').toLowerCase().includes(q));
  });
}

function csvCell(value) {
  const text = String(value ?? '');
  // Quote anything with a delimiter, quote or newline — and defuse spreadsheet formulas.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV text for the given users. Never includes any password data. */
export function usersToCsv(users) {
  const header = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'อีเมล', 'ตำแหน่ง', 'บทบาท', 'สถานะ'];
  const rows = users.map((u) => [
    u.code,
    u.name,
    u.email,
    u.title,
    ROLE_META[u.role].label,
    USER_STATUS_META[u.status].label,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
