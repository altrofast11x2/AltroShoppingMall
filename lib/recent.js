// 최근 검색어 (localStorage 기반, 로그인 유저용)
const KEY = 'altroshop_recent_searches';
const MAX = 8;

export function getRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function addRecentSearch(term) {
  if (typeof window === 'undefined') return;
  const t = String(term || '').trim();
  if (!t) return;
  try {
    const cur = getRecentSearches().filter(x => x !== t);
    cur.unshift(t);
    localStorage.setItem(KEY, JSON.stringify(cur.slice(0, MAX)));
  } catch {}
}

export function removeRecentSearch(term) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(getRecentSearches().filter(x => x !== term)));
  } catch {}
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
}

// ───────── 최근 본 상품 (상품 ID 기록) ─────────
const VIEW_KEY = 'altroshop_recent_views';
const VIEW_MAX = 24;

export function getRecentViews() {
  if (typeof window === 'undefined') return [];
  try {
    const arr = JSON.parse(localStorage.getItem(VIEW_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function addRecentView(productId) {
  if (typeof window === 'undefined') return;
  const id = String(productId || '').trim();
  if (!id) return;
  try {
    const cur = getRecentViews().filter(x => x !== id);
    cur.unshift(id);
    localStorage.setItem(VIEW_KEY, JSON.stringify(cur.slice(0, VIEW_MAX)));
  } catch {}
}

export function clearRecentViews() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(VIEW_KEY); } catch {}
}
