'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/shop';

// ── 인라인 SVG 아이콘 (altroboard 와 동일 톤) ────────────────────
const I: any = {
  Menu: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Home: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 9.5L12 2l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>,
  Upload: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Cart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Coin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8.5 9.5h5.5a2 2 0 1 1 0 4H8.5"/></svg>,
  Admin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Settings: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Login: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  Crown: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M2 8l4 4 6-8 6 8 4-4-2 12H4z"/></svg>,
  Apps: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Chevron: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  Moon: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  External: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  More: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Activity: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Receipt: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Flag: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Swap: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Heart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

const OTHER_APPS = [
  { label: 'AltroBoard',  href: 'https://altroboard.vercel.app/',          icon: <I.Apps width={20} height={20}/> },
  { label: '게시판',       href: 'https://altroboard.vercel.app/board',     icon: <I.More width={20} height={20}/> },
  { label: '갤러리',       href: 'https://altroboard.vercel.app/galleries', icon: <I.Activity width={20} height={20}/> },
  { label: '게임',         href: 'https://altroboard.vercel.app/games',     icon: <I.Apps width={20} height={20}/> },
];

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'collapsed' | 'expanded'>('collapsed');
  const [hover, setHover] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
        } else {
          setUser(s);
        }
      } catch { setUser(null); }
    };
    refresh();
    const saved = localStorage.getItem('altroshop_nav_mode');
    if (saved === 'expanded' || saved === 'collapsed') setMode(saved as any);

    const onRefresh = () => refresh();
    window.addEventListener('storage', onRefresh);
    window.addEventListener('altroshop:refresh', onRefresh);
    return () => {
      window.removeEventListener('storage', onRefresh);
      window.removeEventListener('altroshop:refresh', onRefresh);
    };
  }, [pathname]);

  useEffect(() => {
    setHover(false); setMobileOpen(false); setAppsOpen(false); setMoreOpen(false);
  }, [pathname]);

  // expanded 상태일 때 사이드바 바깥 클릭 → collapsed
  useEffect(() => {
    if (mode !== 'expanded') return;
    const onDocClick = (e: any) => {
      const t = e.target;
      if (t && t.closest && (t.closest('.sidebar') || t.closest('.mob-burger'))) return;
      setMode('collapsed');
      try { localStorage.setItem('altroshop_nav_mode', 'collapsed'); } catch {}
    };
    const id = setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => { clearTimeout(id); document.removeEventListener('click', onDocClick); };
  }, [mode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleMode = () => {
    const next = mode === 'collapsed' ? 'expanded' : 'collapsed';
    setMode(next);
    localStorage.setItem('altroshop_nav_mode', next);
  };

  const toggleTheme = () => {
    const cur = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('altroshop_theme', next); } catch {}
  };

  const logout = () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    localStorage.removeItem('altroshop_user');
    setUser(null);
    window.dispatchEvent(new Event('altroshop:refresh'));
    router.push('/');
  };

  const NAV = [
    { href: '/',       label: '홈',       icon: <I.Home width={22} height={22}/> },
    { href: '/upload', label: '상품 등록', icon: <I.Upload width={22} height={22}/> },
    { href: '/cart',   label: '장바구니',  icon: <I.Cart width={22} height={22}/> },
  ];

  const visualMode = (mode === 'expanded' || hover) ? 'expanded' : 'collapsed';

  return (
    <>
      {/* 모바일 상단 바 */}
      <header className="mob-top">
        <button className="mob-burger" onClick={() => setMobileOpen(true)} aria-label="메뉴">
          <I.Menu width={22} height={22}/>
        </button>
        <Link href="/" className="mob-logo">Altro<span style={{color:'var(--accent2)'}}>Shop</span></Link>
        {user && (
          <span className="mob-coin">◈ {Number(user.coins || 0).toLocaleString()}</span>
        )}
      </header>

      {mobileOpen && <div className="mob-overlay" onClick={() => setMobileOpen(false)} aria-hidden/>}

      <aside
        className={`sidebar ${visualMode} ${mobileOpen ? 'mob-open' : ''}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* 상단 — 로고 + 토글 */}
        <div className="sb-top">
          <button className="sb-toggle desktop-only" onClick={toggleMode} aria-label="메뉴 토글">
            <I.Menu width={22} height={22}/>
          </button>
          <button className="sb-toggle mobile-only" onClick={() => setMobileOpen(false)} aria-label="닫기">
            <I.X width={22} height={22}/>
          </button>
          <Link href="/" className="sb-logo">
            <span className="sb-logo-full">Altro<span style={{color:'var(--accent2)'}}>Shop</span></span>
            <span className="sb-logo-mini">A</span>
          </Link>
        </div>

        {/* 메인 메뉴 */}
        <nav className="sb-nav">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className={`sb-row ${pathname === item.href ? 'active' : ''}`}>
              <span className="sb-icon">{item.icon}</span>
              <span className="sb-label">{item.label}</span>
            </Link>
          ))}

          {user?.isAdmin && (
            <Link href="/admin" className={`sb-row sb-admin ${pathname?.startsWith('/admin') ? 'active' : ''}`}>
              <span className="sb-icon"><I.Admin width={22} height={22}/></span>
              <span className="sb-label">관리자</span>
            </Link>
          )}

          {/* 보유 코인 — 로그인 시 */}
          {user && (
            <div className="sb-coin-row" title={`${Number(user.coins || 0).toLocaleString()} 코인`}>
              <span className="sb-icon" style={{color:'#ffd166'}}><I.Coin width={22} height={22}/></span>
              <span className="sb-label sb-coin-label">{Number(user.coins || 0).toLocaleString()} <small>코인</small></span>
            </div>
          )}
        </nav>

        {/* 더 보기 — altroboard 패턴 */}
        <div className="sb-more">
          <button className="sb-row sb-btn" onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}>
            <span className="sb-icon"><I.More width={22} height={22}/></span>
            <span className="sb-label">더 보기</span>
            <span className="sb-caret" style={{transform: moreOpen ? 'rotate(90deg)' : 'none'}}>
              <I.Chevron width={14} height={14}/>
            </span>
          </button>
          {moreOpen && (
            <div className="sb-sublist">
              <Link href="/" className="sb-row sb-sub">
                <span className="sb-icon"><I.Search width={20} height={20}/></span>
                <span className="sb-label">상품 검색</span>
              </Link>
              {user && (
                <Link href="/cart" className="sb-row sb-sub">
                  <span className="sb-icon"><I.Receipt width={20} height={20}/></span>
                  <span className="sb-label">내 결제내역</span>
                </Link>
              )}
              {user && (
                <Link href="/" className="sb-row sb-sub">
                  <span className="sb-icon"><I.Heart width={20} height={20}/></span>
                  <span className="sb-label">좋아요한 상품</span>
                </Link>
              )}
              <a href="https://altroboard.vercel.app/admin/reports" target="_blank" rel="noopener noreferrer" className="sb-row sb-sub">
                <span className="sb-icon"><I.Flag width={20} height={20}/></span>
                <span className="sb-label">문제 신고</span>
              </a>
              {user && (
                <Link href="/login" className="sb-row sb-sub">
                  <span className="sb-icon"><I.Swap width={20} height={20}/></span>
                  <span className="sb-label">계정 전환</span>
                </Link>
              )}
              {user && (
                <button className="sb-row sb-sub sb-btn" onClick={logout}>
                  <span className="sb-icon"><I.Logout width={20} height={20}/></span>
                  <span className="sb-label">로그아웃</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Altro 다른 앱 — Meta 패턴 */}
        <div className="sb-other-apps">
          <button className="sb-row sb-btn" onClick={() => setAppsOpen(o => !o)} aria-expanded={appsOpen}>
            <span className="sb-icon"><I.Apps width={22} height={22}/></span>
            <span className="sb-label">Altro 다른 앱</span>
            <span className="sb-caret" style={{transform: appsOpen ? 'rotate(90deg)' : 'none'}}>
              <I.Chevron width={14} height={14}/>
            </span>
          </button>
          {appsOpen && (
            <div className="sb-sublist">
              {OTHER_APPS.map(a => (
                <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer" className="sb-row sb-sub">
                  <span className="sb-icon">{a.icon}</span>
                  <span className="sb-label">{a.label}</span>
                  <span className="sb-ext"><I.External width={12} height={12}/></span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 하단 — 프로필 / 설정 / 로그아웃 */}
        <div className="sb-bottom">
          {user ? (
            <>
              <div className="sb-row sb-profile">
                <span className="sb-icon">
                  <span className="sb-avatar-text">{(user.name || '?')[0].toUpperCase()}</span>
                  {user.isAdmin && <span className="sb-role admin"><I.Crown width={9} height={9}/></span>}
                </span>
                <span className="sb-label">{user.name}</span>
              </div>
              <button className="sb-row sb-btn" onClick={logout}>
                <span className="sb-icon"><I.Logout width={22} height={22}/></span>
                <span className="sb-label">로그아웃</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="sb-row sb-login">
              <span className="sb-icon"><I.Login width={22} height={22}/></span>
              <span className="sb-label">로그인</span>
            </Link>
          )}
        </div>
      </aside>

      {/* 본문 자리 확보 */}
      <div className="sb-spacer" aria-hidden="true"/>

      {/* 관리자 배너 */}
      {user?.isAdmin && (
        <div className="admin-banner sb-banner">
          <div className="admin-dot"/>
          관리자 모드 — 사용자별 코인 충전 · 거래 내역 확인 가능
        </div>
      )}

      <style>{`
        .sidebar{position:fixed;top:0;left:0;bottom:0;background:var(--ink);color:var(--bg);z-index:1000;display:flex;flex-direction:column;border-right:1px solid rgba(0,0,0,.3);transition:width .22s ease;box-shadow:2px 0 12px rgba(0,0,0,.15);}
        .sidebar.collapsed{width:72px;}
        .sidebar.expanded{width:240px;}

        .sb-spacer{flex-shrink:0;width:72px;transition:width .22s ease;}

        .sb-banner{position:fixed;top:0;left:72px;right:0;z-index:900;}
        body:has(.sb-banner) .app-content{padding-top:34px;}

        .sb-top{display:flex;align-items:center;gap:.5rem;padding:.85rem .75rem;border-bottom:1px solid rgba(255,255,255,.06);}
        .sb-toggle{background:none;border:none;color:var(--bg);width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
        .sb-toggle:hover{background:rgba(255,255,255,.08);}
        .sb-logo{font-family:var(--serif);font-weight:700;font-size:1.15rem;color:var(--bg);text-decoration:none;letter-spacing:.02em;overflow:hidden;white-space:nowrap;}
        .sb-logo-full{display:inline;}
        .sb-logo-mini{display:none;color:var(--accent2);font-size:1.25rem;}
        .sidebar.collapsed .sb-logo-full{display:none;}
        .sidebar.collapsed .sb-logo-mini{display:inline;}

        .sb-nav{flex:1;overflow-y:auto;padding:.5rem 0;display:flex;flex-direction:column;gap:.1rem;scrollbar-width:thin;}
        .sb-bottom{border-top:1px solid rgba(255,255,255,.06);padding:.5rem 0;display:flex;flex-direction:column;gap:.1rem;}

        .sb-row{display:flex;align-items:center;gap:.85rem;padding:.65rem .85rem;margin:0 .35rem;color:rgba(245,240,232,.7);text-decoration:none;font-family:var(--font);font-size:.92rem;border-radius:8px;cursor:pointer;background:none;border:none;width:calc(100% - .7rem);text-align:left;position:relative;transition:background .15s, color .15s;}
        .sb-row:hover{background:rgba(255,255,255,.06);color:#fff;}
        .sb-row.active{background:rgba(255,255,255,.08);color:#fff;font-weight:600;}
        .sb-row.sb-admin{color:#7dffaa;}
        .sb-row.sb-login{color:var(--accent2);}
        .sb-icon{display:inline-flex;align-items:center;justify-content:center;width:24px;flex-shrink:0;color:inherit;position:relative;}
        .sb-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .sidebar.collapsed .sb-label, .sidebar.collapsed .sb-caret{display:none;}
        .sidebar.collapsed .sb-row{justify-content:center;padding:.65rem .25rem;}
        .sb-caret{margin-left:auto;transition:transform .2s;color:rgba(245,240,232,.5);display:flex;}

        .sb-coin-row{display:flex;align-items:center;gap:.85rem;padding:.65rem .85rem;margin:.5rem .35rem;color:#ffd166;background:rgba(255,209,102,0.05);border:1px solid rgba(255,209,102,0.15);border-radius:8px;}
        .sidebar.collapsed .sb-coin-row{justify-content:center;padding:.65rem .25rem;}
        .sidebar.collapsed .sb-coin-row .sb-coin-label{display:none;}
        .sb-coin-label{font-family:var(--mono);font-weight:700;font-size:.82rem;}
        .sb-coin-label small{font-size:.65rem;opacity:.65;margin-left:.2rem;}

        .sb-avatar-text{width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-family:var(--serif);font-weight:700;font-size:.85rem;display:flex;align-items:center;justify-content:center;}
        .sb-role{position:absolute;bottom:-3px;right:-3px;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);}
        .sb-role.admin{background:#c9a84c;color:#1a1208;}

        .sb-profile{cursor:default;}
        .sb-profile:hover{background:rgba(255,255,255,.04);color:rgba(245,240,232,.85);}

        .sb-more, .sb-other-apps{border-top:1px solid rgba(255,255,255,.06);padding:.3rem 0;}
        .sidebar.collapsed .sb-more .sb-caret,
        .sidebar.collapsed .sb-other-apps .sb-caret{display:none;}
        .sb-sublist{padding-left:0;}
        .sidebar.expanded .sb-sublist .sb-sub{padding-left:2.5rem;}
        .sb-sub{font-size:.85rem;}
        .sb-ext{margin-left:auto;color:rgba(245,240,232,.5);display:flex;align-items:center;}
        .sidebar.collapsed .sb-ext{display:none;}

        /* 모바일 */
        .mob-top{display:none;}
        .mob-overlay{display:none;}
        .mobile-only{display:none;}
        @media(max-width:640px){
          .mob-top{display:flex;align-items:center;gap:.5rem;position:fixed;top:0;left:0;right:0;height:50px;padding:0 .75rem;background:var(--ink);color:var(--bg);z-index:990;border-bottom:1px solid rgba(0,0,0,.3);box-shadow:0 2px 8px rgba(0,0,0,.2);}
          .mob-burger{background:none;border:none;color:var(--bg);width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
          .mob-burger:hover{background:rgba(255,255,255,.08);}
          .mob-logo{font-family:var(--serif);font-weight:700;font-size:1.05rem;color:var(--bg);text-decoration:none;flex:1;}
          .mob-coin{color:#ffd166;font-family:var(--mono);font-weight:700;font-size:.8rem;padding:.25rem .55rem;border:1px solid rgba(255,209,102,0.3);border-radius:4px;}

          .sidebar{transform:translateX(-100%);transition:transform .25s ease;width:260px !important;}
          .sidebar.mob-open{transform:translateX(0);box-shadow:8px 0 32px rgba(0,0,0,.6);}
          .sidebar.collapsed .sb-label, .sidebar.collapsed .sb-caret{display:flex;}
          .sidebar.collapsed .sb-row{justify-content:flex-start;padding:.65rem .85rem;}
          .sidebar.collapsed .sb-coin-row{justify-content:flex-start;padding:.65rem .85rem;}
          .sidebar.collapsed .sb-coin-row .sb-coin-label{display:inline;}
          .sidebar.collapsed .sb-logo-full{display:inline;}
          .sidebar.collapsed .sb-logo-mini{display:none;}

          .sb-spacer{width:0 !important;height:50px;}
          .sb-banner{top:50px;left:0;}

          .desktop-only{display:none;}
          .mobile-only{display:flex;}

          .mob-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;animation:mo-in .2s ease;}
          @keyframes mo-in{from{opacity:0}to{opacity:1}}
        }
        @media(min-width:641px){
          .desktop-only{display:flex;}
        }

        /* 다크 모드 */
        html[data-theme="dark"] .sidebar{background:#0a0703;color:#e8dcc4;border-right-color:#3a2e1d;}
        html[data-theme="dark"] .sb-row{color:rgba(232,220,196,.7);}
        html[data-theme="dark"] .sb-row:hover{background:rgba(255,255,255,.05);color:#fff;}
        html[data-theme="dark"] .sb-toggle{color:#e8dcc4;}
        html[data-theme="dark"] .sb-logo{color:#e8dcc4;}
      `}</style>
    </>
  );
}
