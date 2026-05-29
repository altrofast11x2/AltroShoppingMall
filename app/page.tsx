'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { listProducts, toggleLike } from '@/lib/shop';
import { slugToLabel, CATEGORIES } from '@/lib/categories';
import { getRecentSearches, removeRecentSearch, clearRecentSearches } from '@/lib/recent';

export const dynamic = 'force-dynamic';

const Ico: any = {
  Heart: (p: any) => <svg viewBox="0 0 24 24" fill={p.fill || 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Clock: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Sports: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>,
  Digital: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Star: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Coin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5h5a2 2 0 1 1 0 4H9.5v4M14.5 13.5L9.5 18"/></svg>,
  Arrow: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Women: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>,
  Shield: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  Gift: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Chat: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Bag: (p: any) => <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M30 42h60l-6 56a8 8 0 0 1-8 7H44a8 8 0 0 1-8-7z"/><path d="M44 42V28a16 16 0 0 1 32 0v14"/><circle cx="44" cy="64" r="3" fill="currentColor"/><circle cx="76" cy="64" r="3" fill="currentColor"/></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// 자동 회전 슬라이드 (광고 아닌 AltroBoard 홍보 / 서비스 소개)
const SLIDES = [
  {
    bg: 'bj-hero-s0',
    eyebrow: 'ALTROSHOP × ALTROBOARD',
    title: <>AltroBoard 계정 그대로<br/>로그인 한 번이면 끝</>,
    sub: '별도 가입 없이 AltroBoard 계정으로 바로 이용하세요. 첫 로그인 시 100코인 보너스를 드립니다.',
    cta: { label: 'AltroBoard 둘러보기', href: 'https://altroboard.vercel.app/', external: true },
    art: <Ico.Bag width={150} height={150}/>,
  },
  {
    bg: 'bj-hero-s1',
    eyebrow: 'SAFE PAYMENT · 에스크로',
    title: <>안전결제로<br/>믿고 거래하세요</>,
    sub: '결제 코인은 에스크로에 안전하게 보관됩니다. 상품을 받고 구매 확정하면 그때 판매자에게 정산돼요.',
    cta: { label: '상품 둘러보기', href: '#products' },
    art: <Ico.Shield width={140} height={140}/>,
  },
  {
    bg: 'bj-hero-s2',
    eyebrow: 'WELCOME BONUS · 100',
    title: <>지금 시작하면<br/>100코인 보너스</>,
    sub: '10,000코인 = 10,000원. AltroBoard 계정으로 첫 로그인하면 100코인을 바로 드립니다.',
    cta: { label: '코인 충전 요청', href: '/coin-request' },
    art: <Ico.Gift width={140} height={140}/>,
  },
  {
    bg: 'bj-hero-s3',
    eyebrow: 'COMMUNITY MARKET',
    title: <>댓글과 좋아요로<br/>소통하는 마켓</>,
    sub: '마음에 드는 상품엔 찜과 댓글을. AltroShop은 거래를 넘어 커뮤니티로 연결됩니다.',
    cta: { label: '내 상품 등록하기', href: '/upload' },
    art: <Ico.Chat width={140} height={140}/>,
  },
];

const QUICK = [
  { label: '찜한상품',  icon: <Ico.Heart width={26} height={26}/>,    href: '/?cat=liked', authRequired: true },
  { label: '여성의류',  icon: <Ico.Women width={26} height={26}/>,    href: '/?cat=women' },
  { label: '남성의류',  icon: <Ico.Star width={26} height={26}/>,     href: '/?cat=men' },
  { label: '디지털',    icon: <Ico.Digital width={26} height={26}/>,  href: '/?cat=digital' },
  { label: '스포츠',    icon: <Ico.Sports width={26} height={26}/>,   href: '/?cat=sports' },
  { label: '코인충전',  icon: <Ico.Coin width={26} height={26}/>,     href: '/coin-request', authRequired: true },
];

export default function HomePage() {
  return (
    <Suspense fallback={<main className="bj-main"><div className="bj-empty">불러오는 중...</div></main>}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [slide, setSlide] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get('q') || '';
  const cat = sp.get('cat') || '';

  useEffect(() => {
    try {
      const raw = localStorage.getItem('altroshop_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setRecents(getRecentSearches());
    const refresh = () => listProducts().then(list => {
      setProducts(list);
      setLoading(false);
    });
    refresh();
    const onRefresh = () => { refresh(); setRecents(getRecentSearches()); };
    window.addEventListener('altroshop:refresh', onRefresh);
    return () => window.removeEventListener('altroshop:refresh', onRefresh);
  }, []);

  // 슬라이드 자동 회전
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const requireLogin = (e: any) => {
    if (!user) {
      e?.preventDefault?.();
      alert('로그인이 필요한 기능입니다');
      router.push('/login');
      return true;
    }
    return false;
  };

  const onLike = async (e: any, pid: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (requireLogin(e)) return;
    await toggleLike(pid, user.id);
    const list = await listProducts();
    setProducts(list);
  };

  // 필터링: 검색어(q) → 카테고리(cat) → 찜(cat=liked)
  let filtered = products;
  if (q) {
    const lq = q.toLowerCase();
    filtered = filtered.filter(p => p.name?.toLowerCase().includes(lq) || p.desc?.toLowerCase().includes(lq));
  } else if (cat === 'liked') {
    filtered = user ? filtered.filter(p => p.likes && p.likes[user.id]) : [];
  } else if (cat) {
    filtered = filtered.filter(p => (p.category || 'etc') === cat);
  }

  const heading = q
    ? `"${q}" 검색 결과`
    : cat === 'liked'
      ? '찜한 상품'
      : cat
        ? `${slugToLabel(cat)}`
        : '오늘의 추천 아이템';

  const emptyMsg = q
    ? `"${q}" 와 일치하는 상품이 없습니다.`
    : cat === 'liked'
      ? (user ? '아직 찜한 상품이 없습니다. 마음에 드는 상품에 하트를 눌러보세요.' : '로그인 후 찜한 상품을 볼 수 있습니다.')
      : cat
        ? `${slugToLabel(cat)} 카테고리에 등록된 상품이 없습니다.`
        : '등록된 상품이 없습니다.';

  const showHome = !q && !cat;
  const fmt = (n: number) => Number(n).toLocaleString();
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return Math.max(1, Math.floor(diff / 60000)) + '분 전';
    if (h < 24) return h + '시간 전';
    const d = Math.floor(h / 24);
    if (d < 30) return d + '일 전';
    return new Date(iso).toLocaleDateString('ko-KR');
  };

  const onCta = (e: any, c: any) => {
    if (c.href === '#products') {
      e.preventDefault();
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!c.external && (c.href === '/upload' || c.href === '/coin-request')) {
      if (requireLogin(e)) return;
    }
  };

  const removeRecent = (term: string) => { removeRecentSearch(term); setRecents(getRecentSearches()); };
  const clearRecents = () => { clearRecentSearches(); setRecents([]); };

  return (
    <main className="bj-main">
      {showHome && (
        <>
          {/* 자동 회전 히어로 슬라이드 */}
          <section className="bj-hero">
            {SLIDES.map((s, i) => (
              <div key={i} className={`bj-hero-slide ${s.bg} ${i === slide ? 'active' : ''}`} aria-hidden={i !== slide}>
                <div className="bj-hero-text">
                  <div className="bj-hero-eyebrow">{s.eyebrow}</div>
                  <h1 className="bj-hero-title">{s.title}</h1>
                  <p className="bj-hero-sub">{s.sub}</p>
                  {s.cta.external ? (
                    <a href={s.cta.href} target="_blank" rel="noopener noreferrer" className="bj-hero-cta">
                      {s.cta.label} <Ico.Arrow width={14} height={14}/>
                    </a>
                  ) : (
                    <Link href={s.cta.href} className="bj-hero-cta" onClick={(e) => onCta(e, s.cta)}>
                      {s.cta.label} <Ico.Arrow width={14} height={14}/>
                    </Link>
                  )}
                </div>
                <div className="bj-hero-art" aria-hidden>{s.art}</div>
              </div>
            ))}
            <div className="bj-hero-dots">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`bj-hero-dot ${i === slide ? 'on' : ''}`}
                  onClick={() => setSlide(i)}
                  aria-label={`슬라이드 ${i + 1}`}
                />
              ))}
            </div>
          </section>

          {/* 최근 검색 (로그인 유저) */}
          {user && recents.length > 0 && (
            <div className="bj-recent">
              <span className="bj-recent-label">
                <Ico.Clock width={13} height={13}/> 최근 검색
              </span>
              {recents.map(term => (
                <span key={term} className="bj-recent-chip">
                  <Link href={`/?q=${encodeURIComponent(term)}`}>{term}</Link>
                  <button className="bj-recent-chip-x" onClick={() => removeRecent(term)} aria-label="삭제">
                    <Ico.X width={10} height={10}/>
                  </button>
                </span>
              ))}
              <button className="bj-recent-clear" onClick={clearRecents}>전체 삭제</button>
            </div>
          )}

          <section className="bj-quick">
            {QUICK.map(qi => (
              <Link
                key={qi.label}
                href={qi.href}
                className="bj-quick-item"
                onClick={(e) => qi.authRequired && requireLogin(e)}
              >
                <div className="bj-quick-icon">{qi.icon}</div>
                <div className="bj-quick-label">{qi.label}</div>
              </Link>
            ))}
          </section>
        </>
      )}

      <div className="bj-section-head" id="products">
        <h2 className="bj-section-title">{heading}</h2>
        {!loading && <span className="bj-section-link">{filtered.length}개</span>}
      </div>

      {loading ? (
        <div className="bj-empty">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bj-empty">
          {emptyMsg}<br />
          {cat === 'liked' && !user
            ? <Link href="/login">로그인하기 →</Link>
            : <Link href={user ? '/upload' : '/login'}>첫 상품 등록하기 →</Link>}
        </div>
      ) : (
        <div className="bj-grid">
          {filtered.map(p => {
            const liked = user && p.likes && p.likes[user.id];
            return (
              <Link key={p.id} href={`/product/${p.id}`} className="bj-card">
                <div className="bj-card-img">
                  {p.image && <img src={p.image} alt={p.name} loading="lazy"/>}
                  <button
                    className={`bj-card-heart ${liked ? 'on' : ''}`}
                    onClick={(e) => onLike(e, p.id)}
                    aria-label="찜"
                  >
                    <Ico.Heart width={18} height={18} fill={liked ? 'currentColor' : 'none'}/>
                  </button>
                </div>
                <div className="bj-card-body">
                  {p.category && <div className="bj-card-cat">{slugToLabel(p.category)}</div>}
                  <div className="bj-card-price">{fmt(p.price)}원</div>
                  <div className="bj-card-name">{p.name}</div>
                  <div className="bj-card-meta">
                    <span>{timeAgo(p.createdAt)}</span>
                    <span className="bj-card-meta-dot"/>
                    <span className={liked ? 'liked' : ''}>{liked ? '♥' : '♡'} {p.likeCount}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
