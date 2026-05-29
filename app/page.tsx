'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { listProducts, toggleLike } from '@/lib/shop';

export const dynamic = 'force-dynamic';

const Ico: any = {
  Heart: (p: any) => <svg viewBox="0 0 24 24" fill={p.fill || 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Phone: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Sports: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Digital: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Star: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Coin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5h5a2 2 0 1 1 0 4H9.5v4M14.5 13.5L9.5 18"/></svg>,
};

const QUICK = [
  { label: '찜', icon: <Ico.Heart width={28} height={28} fill="currentColor"/>, href: '/?cat=liked', authRequired: true },
  { label: '최근본상품', icon: <Ico.Search width={26} height={26}/>, href: '/' },
  { label: '코인충전', icon: <Ico.Coin width={26} height={26}/>, href: '/coin-request', authRequired: true },
  { label: '스포츠', icon: <Ico.Sports width={26} height={26}/>, href: '/?cat=sports' },
  { label: '디지털', icon: <Ico.Digital width={26} height={26}/>, href: '/?cat=digital' },
  { label: '스타굿즈', icon: <Ico.Star width={26} height={26}/>, href: '/?cat=stargoods' },
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
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get('q') || '';

  useEffect(() => {
    try {
      const raw = localStorage.getItem('altroshop_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    const refresh = () => listProducts().then(list => {
      setProducts(list);
      setLoading(false);
    });
    refresh();
    window.addEventListener('altroshop:refresh', refresh);
    return () => window.removeEventListener('altroshop:refresh', refresh);
  }, []);

  const requireLogin = (e: any) => {
    if (!user) {
      e.preventDefault();
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

  const filtered = q
    ? products.filter(p => p.name?.toLowerCase().includes(q.toLowerCase()) || p.desc?.toLowerCase().includes(q.toLowerCase()))
    : products;

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

  return (
    <main className="bj-main">
      {!q && (
        <>
          <section className="bj-hero">
            <div className="bj-hero-text">
              <div className="bj-hero-eyebrow">AltroShop 커뮤니티 마켓</div>
              <div className="bj-hero-title">
                사고, 팔고, 둘러보고<br />
                이제 모두 첫 화면에서
              </div>
            </div>
            <div className="bj-hero-emoji">🛍️</div>
            <div className="bj-hero-meta">1/1</div>
          </section>

          <section className="bj-quick">
            {QUICK.map(q => (
              <Link
                key={q.label}
                href={q.href}
                className="bj-quick-item"
                onClick={(e) => q.authRequired && requireLogin(e)}
              >
                <div className="bj-quick-icon">{q.icon}</div>
                <div className="bj-quick-label">{q.label}</div>
              </Link>
            ))}
          </section>
        </>
      )}

      <div className="bj-section-head">
        <h2 className="bj-section-title">
          {q ? `"${q}" 검색 결과` : '오늘의 추천 아이템'}
        </h2>
        {!loading && <span className="bj-section-link">{filtered.length}개</span>}
      </div>

      {loading ? (
        <div className="bj-empty">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bj-empty">
          {q ? `"${q}" 와 일치하는 상품이 없습니다.` : '등록된 상품이 없습니다.'}<br />
          <Link href={user ? '/upload' : '/login'}>첫 상품 등록하기 →</Link>
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
                  <div className="bj-card-price">{fmt(p.price)}원</div>
                  <div className="bj-card-name">{p.name}</div>
                  <div className="bj-card-meta">
                    <span>{timeAgo(p.createdAt)}</span>
                    <span className="bj-card-meta-dot"/>
                    <span>♡ {p.likeCount}</span>
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
