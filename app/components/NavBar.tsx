'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/shop';

const Ico: any = {
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Menu: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Ext: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  User: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Upload: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Cart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Coin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5h5a2 2 0 1 1 0 4H9.5v4M14.5 13.5L9.5 18"/></svg>,
  Receipt: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Shield: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Logout: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const CATS = [
  { label: '카테고리', href: '/', icon: true },
  { label: '여성의류', href: '/?cat=women' },
  { label: '남성의류', href: '/?cat=men' },
  { label: '스포츠/레저', href: '/?cat=sports' },
  { label: '스타굿즈', href: '/?cat=stargoods' },
  { label: '디지털', href: '/?cat=digital' },
  { label: '키덜트', href: '/?cat=kidult' },
];

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
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

  useEffect(() => { setDrawer(false); }, [pathname]);

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
    if (!search.trim()) return;
    router.push(`/?q=${encodeURIComponent(search.trim())}`);
  };

  const coins = Number(user?.coins || 0);
  const won = coins; // 1코인 = 1원 (10000코인 = 10000원)

  return (
    <>
      <header className="bj-header">
        <div className="bj-header-inner">
          <Link href="/" className="bj-logo">
            <div className="bj-logo-bolt" aria-hidden />
            AltroShop
          </Link>

          <form className="bj-search" onSubmit={submitSearch}>
            <span className="bj-search-icon"><Ico.Search width={18} height={18}/></span>
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
                <Link href="/coin-request" className="bj-user-coin" title="코인 충전 요청">
                  ◈ {coins.toLocaleString()}
                </Link>
                <button onClick={() => setDrawer(true)} className="bj-avatar" aria-label="메뉴">
                  {(user.name || '?')[0].toUpperCase()}
                </button>
              </>
            ) : (
              <Link href="/login" className="bj-login-btn">로그인/회원가입</Link>
            )}
            <button onClick={() => setDrawer(true)} className="bj-hamburger" aria-label="메뉴">
              <Ico.Menu width={22} height={22}/>
            </button>
          </div>
        </div>

        {/* 모바일 검색 */}
        <div className="bj-mob-search-row">
          <form className="bj-search" onSubmit={submitSearch}>
            <span className="bj-search-icon"><Ico.Search width={18} height={18}/></span>
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
              {CATS.map(c => (
                <Link key={c.label} href={c.href} className="bj-cat">
                  {c.icon && (
                    <span className="bj-cat-icon">
                      <Ico.Menu width={16} height={16}/>
                    </span>
                  )}
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="bj-cats">
              <a href="https://altroboard.vercel.app/" target="_blank" rel="noopener noreferrer" className="bj-cat-ext">
                AltroBoard <Ico.Ext width={12} height={12}/>
              </a>
              {user && (
                <Link href="/upload" className="bj-cat-ext">
                  판매자센터 <Ico.Ext width={12} height={12}/>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 햄버거 드로어 */}
      {drawer && (
        <>
          <div className="bj-drawer-overlay" onClick={() => setDrawer(false)} />
          <aside className="bj-drawer">
            <div className="bj-drawer-head">
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>메뉴</div>
              <button className="bj-drawer-close" onClick={() => setDrawer(false)} aria-label="닫기">
                <Ico.X width={20} height={20}/>
              </button>
            </div>

            {user ? (
              <>
                <Link href="/profile" className="bj-drawer-user">
                  <div className="bj-avatar">{(user.name || '?')[0].toUpperCase()}</div>
                  <div>
                    <div className="bj-drawer-user-name">{user.name}</div>
                    <div className="bj-drawer-user-email">{user.email}</div>
                  </div>
                </Link>
                <div className="bj-drawer-coin">
                  <div className="bj-drawer-coin-label">보유 코인</div>
                  <div className="bj-drawer-coin-value">◈ {coins.toLocaleString()}</div>
                  <div className="bj-drawer-coin-won">≈ {won.toLocaleString()}원 (10,000코인 = 10,000원)</div>
                  <Link href="/coin-request" className="bj-drawer-coin-btn">💰 코인 충전 요청</Link>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px' }}>
                <Link href="/login" className="bj-btn bj-btn-primary bj-btn-block" onClick={() => setDrawer(false)}>
                  로그인 / 회원가입
                </Link>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, textAlign: 'center', lineHeight: 1.6 }}>
                  AltroBoard 계정으로도 로그인할 수 있어요<br />
                  첫 로그인 시 100코인 보너스 지급
                </p>
              </div>
            )}

            <nav className="bj-drawer-nav">
              <Link href="/" className="bj-drawer-item">🏠 홈</Link>
              <Link href="/upload" className="bj-drawer-item">📷 상품 등록</Link>
              <Link href="/cart" className="bj-drawer-item">🛒 장바구니</Link>
              {user && <Link href="/profile" className="bj-drawer-item">📦 내가 등록한 상품</Link>}
              {user && <Link href="/orders" className="bj-drawer-item">📋 구매내역</Link>}
              {user && <Link href="/coin-request" className="bj-drawer-item">💰 코인 충전 요청</Link>}
              <div className="bj-drawer-divider" />
              <a href="https://altroboard.vercel.app/" target="_blank" rel="noopener noreferrer" className="bj-drawer-item">
                ↗ AltroBoard
              </a>
              <a href="https://altroboard.vercel.app/games" target="_blank" rel="noopener noreferrer" className="bj-drawer-item">
                ↗ 게임
              </a>
              {user?.isAdmin && (
                <>
                  <div className="bj-drawer-divider" />
                  <Link href="/admin" className="bj-drawer-item admin">👑 관리자 패널</Link>
                </>
              )}
              {user && (
                <>
                  <div className="bj-drawer-divider" />
                  <button onClick={logout} className="bj-drawer-item danger">로그아웃</button>
                </>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
