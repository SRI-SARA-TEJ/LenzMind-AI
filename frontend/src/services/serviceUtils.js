/**
 * services/serviceUtils.js — Shared Pure Utility Helpers
 *
 * Small, stateless math and string helpers that are used across multiple
 * service files.  All functions are pure — no React, no side effects.
 *
 * ── Exports ───────────────────────────────────────────────────────────────────
 *   clamp(n, lo, hi)   — clamp a number to [lo, hi]
 *   mean(nums)         — safe arithmetic mean (1 decimal), returns 0 on empty
 *   freq(values)       — build a { value → count } frequency map
 *   daysAgoIso(n)      — ISO timestamp for N days ago
 *   cap(str)           — capitalise first letter of a string
 */

/** Clamp a number between lo and hi. */
export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Safe arithmetic mean rounded to 1 decimal place.
 * Ignores non-numeric and NaN values.  Returns 0 for an empty input.
 *
 * @param {number[]} nums
 * @returns {number}
 */
export function mean(nums) {
  const valid = nums.filter(n => typeof n === 'number' && !Number.isNaN(n));
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

/**
 * Build a frequency map: value → occurrence count.
 * Null, undefined, and empty-string values are skipped.
 *
 * @param {Array} values
 * @returns {Object}
 */
export function freq(values) {
  const map = {};
  for (const v of values) {
    if (v != null && v !== '') map[v] = (map[v] ?? 0) + 1;
  }
  return map;
}

/**
 * Return an ISO date string for N days ago from now.
 *
 * @param {number} n
 * @returns {string}
 */
export function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * Capitalise the first letter of a string.
 * Returns an empty string for falsy input.
 *
 * @param {string} str
 * @returns {string}
 */
export function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
