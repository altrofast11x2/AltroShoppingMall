'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/shop';
import { CATEGORIES, HEADER_CATEGORY_SLUGS } from '@/lib/categories';
import { addRecentSearch } from '@/lib/recent';

// ── SVG 아이콘 (이모지 절대 사용 안 함) ────────────────────
const I: any = {
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Menu: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Ext: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Chevron: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  More: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Apps: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  User: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Receipt: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Heart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Coin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5h5a2 2 0 1 1 0 4H9.5v4M14.5 13.5L9.5 18"/></svg>,
  Cart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Upload: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Swap: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Logout: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Login: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  Shield: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Flag: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Board: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="20"/></svg>,
  Gallery: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  Games: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68A4 4 0 0 0 3 8.86v6.28A4 4 0 0 0 6.68 19h10.64A4 4 0 0 0 21 15.14V8.86A4 4 0 0 0 17.32 5z"/></svg>,
  Study: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Data: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>,
  Shorts: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="20" rx="3"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>,
  Music: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Crown: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M2 8l4 4 6-8 6 8 4-4-2 12H4z"/></svg>,
  Todo: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 11 12 14 20 6"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>,
  Cog: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// 헤더 카테고리 바에 직접 노출할 항목 (공용 카테고리 정의 기반)
const HEADER_CATS = HEADER_CATEGORY_SLUGS
  .map(slug => CATEGORIES.find(c => c.slug === slug))
  .filter(Boolean) as { slug: string; label: string }[];

// "더 보기" 섹션 항목 (altroboard 패턴)
// adminHide: 관리자에게는 숨김 (관리자가 자신에게 코인 요청할 필요 없음)
const MORE_ITEMS = [
  { label: '내 프로필',        href: '/profile',       icon: <I.User width={18} height={18}/>, auth: true },
  { label: '내가 등록한 상품', href: '/profile',       icon: <I.Upload width={18} height={18}/>, auth: true },
  { label: '구매내역',         href: '/orders',        icon: <I.Receipt width={18} height={18}/>, auth: true },
  { label: '찜한 상품',         href: '/?cat=liked',    icon: <I.Heart width={18} height={18}/>, auth: true },
  { label: '코인 충전 요청',    href: '/coin-request',  icon: <I.Coin width={18} height={18}/>, auth: true, adminHide: true },
  { label: '문제 신고',         href: '/report',        icon: <I.Flag width={18} height={18}/> },
  { label: '설정',             href: '/settings',      icon: <I.Cog width={18} height={18}/> },
  { label: '계정 전환',         href: '/login',         icon: <I.Swap width={18} height={18}/>, auth: true },
];

// Altro 독립 앱(서비스) 목록 — AltroBoard 내부 기능(게시판/게임 등)이 아니라 별도 앱만 노출
const OTHER_APPS = [
  { label: 'AltroBoard', href: 'https://altroboard.vercel.app/', icon: <I.Apps width={20} height={20}/> },
  { label: 'AltroTodo',  href: 'https://altrotodo.vercel.app/',  icon: <I.Todo width={20} height={20}/> },
];

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const refresh = async () => {
      try {
        const raw = localStorage.getItem('altroshop_user');
        if (!raw) { setUser(null); return; }
        const s = JSON.parse(raw);
        const fresh = await getUser(s.id);
        if (fresh) {
          const merged = { ...s, coins: fresh.coins };
          setUser(merged);
          localStorage.setItem('altroshop_user', JSON.stringify(merged));
        } else { setUser(s); }
      } catch { setUser(null); }
    };
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener('storage', onRefresh);
    window.addEventListener('altroshop:refresh', onRefresh);
    return () => {
      window.removeEventListener('storage', onRefresh);
      window.removeEventListener('altroshop:refresh', onRefresh);
    };
  }, [pathname]);

  useEffect(() => { setDrawer(false); setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  const logout = () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    localStorage.removeItem('altroshop_user');
    setUser(null);
    window.dispatchEvent(new Event('altroshop:refresh'));
    router.push('/');
  };

  const submitSearch = (e: any) => {
    e.preventDefault();
    const t = search.trim();
    if (!t) return;
    if (user) addRecentSearch(t); // 로그인 유저만 최근 검색 기록
    window.dispatchEvent(new Event('altroshop:refresh'));
    router.push(`/?q=${encodeURIComponent(t)}`);
  };

  const coins = Number(user?.coins || 0);
  const isAdmin = !!user?.isAdmin;

  return (
    <>
      <header className="bj-header">
        <div className="bj-header-inner">
          <Link href="/" className="bj-logo">
            Altro<span>Shop</span>
          </Link>

          <form className="bj-search" onSubmit={submitSearch}>
            <span className="bj-search-icon"><I.Search width={18} height={18}/></span>
            <input
              type="text"
              placeholder="상품명이나 상점명을 검색해주세요"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>

          <div className="bj-header-right">
            {user ? (
              <>
                <Link
                  href={isAdmin ? '/admin' : '/coin-request'}
                  className="bj-user-coin"
                  title={isAdmin ? '관리자 패널' : '코인 충전 요청'}
                >
                  <I.Coin width={14} height={14}/> {coins.toLocaleString()}
                </Link>
                <button onClick={() => setDrawer(true)} className="bj-avatar" aria-label="메뉴">
                  {(user.name || '?')[0].toUpperCase()}
                </button>
              </>
            ) : (
              <Link href="/login" className="bj-login-btn">로그인/회원가입</Link>
            )}
            <button onClick={() => setDrawer(true)} className="bj-hamburger" aria-label="메뉴">
              <I.Menu width={22} height={22}/>
            </button>
          </div>
        </div>

        {/* 모바일 검색 */}
        <div className="bj-mob-search-row">
          <form className="bj-search" onSubmit={submitSearch}>
            <span className="bj-search-icon"><I.Search width={18} height={18}/></span>
            <input
              type="text"
              placeholder="상품명이나 상점명을 검색해주세요"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="bj-catbar">
          <div className="bj-catbar-inner">
            <div className="bj-cats">
              {/* 전체 카테고리 — 호버하면 드롭다운 */}
              <div className="bj-cat-wrap">
                <span className="bj-cat">
                  <span className="bj-cat-icon"><I.Menu width={16} height={16}/></span>
                  카테고리
                </span>
                <div className="bj-cat-dropdown">
                  {CATEGORIES.map(c => (
                    <Link key={c.slug} href={`/?cat=${c.slug}`} className="bj-cat-dd-item">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
              {HEADER_CATS.map(c => (
                <Link key={c.slug} href={`/?cat=${c.slug}`} className="bj-cat">
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="bj-cats">
              {user && (
                <Link href="/upload" className="bj-cat-ext">
                  판매자센터 <I.Ext width={12} height={12}/>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 햄버거 드로어 — altroboard 패턴 */}
      {drawer && (
        <>
          <div className="bj-drawer-overlay" onClick={() => setDrawer(false)} />
          <aside className="bj-drawer">
            <div className="bj-drawer-head">
              <div className="bj-drawer-head-title">메뉴</div>
              <button className="bj-drawer-close" onClick={() => setDrawer(false)} aria-label="닫기">
                <I.X width={20} height={20}/>
              </button>
            </div>

            {user ? (
              <>
                <Link href="/profile" className="bj-drawer-user">
                  <div className="bj-avatar">{(user.name || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bj-drawer-user-name">
                      {user.name}
                      {user.isAdmin && <span className="bj-drawer-admin-badge">관리자</span>}
                    </div>
                    <div className="bj-drawer-user-email">{user.email}</div>
                  </div>
                </Link>
                <div className="bj-drawer-coin">
                  <div className="bj-drawer-coin-label">보유 코인{isAdmin ? ' (관리자)' : ''}</div>
                  <div className="bj-drawer-coin-value">{coins.toLocaleString()}</div>
                  <div className="bj-drawer-coin-won">= {coins.toLocaleString()}원 · 10,000코인 = 10,000원</div>
                  {isAdmin ? (
                    <Link href="/admin" className="bj-drawer-coin-btn">
                      <I.Shield width={14} height={14}/> 관리자 패널
                    </Link>
                  ) : (
                    <Link href="/coin-request" className="bj-drawer-coin-btn">
                      <I.Coin width={14} height={14}/> 코인 충전 요청
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="bj-drawer-cta">
                <Link href="/login" className="bj-drawer-coin-btn" style={{ marginTop: 0 }}>
                  <I.Login width={14} height={14}/> 로그인 / 회원가입
                </Link>
                <div className="bj-drawer-cta-note">
                  AltroBoard 계정으로도 로그인할 수 있어요<br />
                  첫 로그인 시 <strong>100코인 보너스</strong> 지급
                </div>
              </div>
            )}

            <nav className="bj-drawer-nav">
              {/* 더 보기 */}
              <div className="bj-drawer-section">
                <button className="bj-drawer-section-btn" onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}>
                  <span className="bj-drawer-section-icon"><I.More width={20} height={20}/></span>
                  <span>더 보기</span>
                  <span className={`bj-drawer-section-caret ${moreOpen ? 'open' : ''}`}>
                    <I.Chevron width={14} height={14}/>
                  </span>
                </button>
                {moreOpen && (
                  <div className="bj-drawer-sublist">
                    {MORE_ITEMS
                      .filter(i => (!i.auth || user) && !(i.adminHide && isAdmin))
                      .map(item => (
                        <Link key={item.label} href={item.href} className={`bj-drawer-item ${pathname === item.href ? 'active' : ''}`}>
                          <span className="bj-drawer-item-icon">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              {/* Altro 다른 앱 — 독립 앱만 (AltroBoard 내부 기능은 제외) */}
              <div className="bj-drawer-section">
                {OTHER_APPS.map(a => (
                  <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className="bj-drawer-section-btn">
                    <span className="bj-drawer-section-icon">{a.icon}</span>
                    <span>{a.label}</span>
                    <span className="bj-drawer-item-ext" style={{ marginLeft: 'auto' }}><I.Ext width={13} height={13}/></span>
                  </a>
                ))}
              </div>
            </nav>

            {/* 하단 — 관리자 / 빠른 액션 */}
            {user && (
              <div className="bj-drawer-bottom">
                {user.isAdmin && (
                  <Link href="/admin" className="bj-drawer-section-btn" style={{ color: '#7dffaa' }}>
                    <span className="bj-drawer-section-icon"><I.Shield width={20} height={20}/></span>
                    <span>관리자 패널</span>
                  </Link>
                )}
                <Link href="/upload" className="bj-drawer-section-btn">
                  <span className="bj-drawer-section-icon"><I.Upload width={20} height={20}/></span>
                  <span>상품 등록</span>
                </Link>
                <Link href="/cart" className="bj-drawer-section-btn">
                  <span className="bj-drawer-section-icon"><I.Cart width={20} height={20}/></span>
                  <span>장바구니</span>
                </Link>
                <button onClick={logout} className="bj-drawer-section-btn bj-drawer-logout">
                  <span className="bj-drawer-section-icon"><I.Logout width={20} height={20}/></span>
                  <span>로그아웃</span>
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
