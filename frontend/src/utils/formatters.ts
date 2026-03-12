// ============================================
// Nanosecond conversion constants
// ============================================
// The IC (Internet Computer) uses nanoseconds for timestamps,
// while JavaScript uses milliseconds.

/** Nanoseconds per millisecond (1,000,000) */
export const NS_PER_MS = BigInt(1_000_000);

/** Nanoseconds per second */
export const NS_PER_SECOND = BigInt(1_000_000_000);

/** Nanoseconds per day (86,400,000,000,000) */
export const NS_PER_DAY = BigInt(86_400_000_000_000);

// ============================================
// Date conversion helpers
// ============================================

/**
 * Convert bigint nanoseconds (ICP timestamp) to JavaScript Date
 */
export function nanosecondsToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp / NS_PER_MS));
}

/**
 * Convert a JavaScript Date to bigint nanoseconds (ICP timestamp)
 */
export function toNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * NS_PER_MS;
}

/**
 * Get today's date as a string in YYYY-MM-DD format (for HTML date inputs)
 * This correctly uses local timezone, avoiding the toISOString() UTC bug
 */
export function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert nanoseconds to YYYY-MM-DD string in local timezone
 * Use this when populating a date input from backend data
 */
export function nanosecondsToLocalDateString(nanoseconds: bigint): string {
  const date = nanosecondsToDate(nanoseconds);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD string to nanoseconds (parsing as local midnight)
 * Use this when saving a date input value to the backend
 */
export function localDateStringToNanoseconds(dateString: string): bigint {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return BigInt(date.getTime()) * NS_PER_MS;
}

// ============================================
// Date formatting helpers
// ============================================

export function formatDate(timestamp: bigint): string {
  const date = nanosecondsToDate(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: bigint): string {
  const date = nanosecondsToDate(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(timestamp: bigint): string {
  const date = nanosecondsToDate(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
