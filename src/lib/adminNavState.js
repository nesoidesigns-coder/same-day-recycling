// Pinned pages and recently visited pages for the Command Centre navigation.
// Stored per browser — no server records, nothing to migrate.

const PINS_KEY = "sdr_admin_pins";
const RECENT_KEY = "sdr_admin_recent";
const MAX_RECENT = 6;

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — navigation still works, just without memory */
  }
};

export const getPins = () => read(PINS_KEY, []);

export const isPinned = (path) => getPins().includes(path);

export const togglePin = (path) => {
  const pins = getPins();
  const next = pins.includes(path) ? pins.filter((p) => p !== path) : [path, ...pins];
  write(PINS_KEY, next.slice(0, 10));
  return next.slice(0, 10);
};

export const getRecent = () => read(RECENT_KEY, []);

export const recordVisit = (path) => {
  if (!path) return getRecent();
  const next = [path, ...getRecent().filter((p) => p !== path)].slice(0, MAX_RECENT);
  write(RECENT_KEY, next);
  return next;
};