// Server-only. Never import this from a 'use client' file — pwd_hash values
// must never reach the browser.

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Resolves false (never throws) for a malformed or placeholder hash. */
export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
