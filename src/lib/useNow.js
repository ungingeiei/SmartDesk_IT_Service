'use client';

import { useSyncExternalStore } from 'react';

/** Never changes — "now" is read once per session, as the original design does. */
function subscribe() {
  return () => {};
}

let clientNow = null;

/** Cached so `getSnapshot` is stable across renders, as the hook requires. */
function getSnapshot() {
  clientNow ??= Date.now();
  return clientNow;
}

function getServerSnapshot() {
  return null;
}

/**
 * Wall-clock time, but only on the client.
 *
 * Returns `null` during the server render and the first paint, so anything
 * derived from "now" (the SLA countdowns) can render a placeholder instead of
 * producing markup that would not match after hydration.
 */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
