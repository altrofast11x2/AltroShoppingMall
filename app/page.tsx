'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listProducts } from '@/lib/shop';

type Product = {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  sellerName: string;
  likeCount: number;
  createdAt: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    // 세션 체크
    try {
      const raw = localStorage.getItem('altroshop_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    const onRefresh = () => {
      try {
        const raw = localStorage.getItem('altroshop_user');
        setUser(raw ? JSON.parse(raw) : null);
      } catch { setUser(null); }
    };
    window.addEventListener('storage', onRefresh);
    window.addEventListener('altroshop:refresh', onRefresh);

    listProducts().then(list => {
      if (!alive) return;
      setProducts(list as Product[]);
      setLoading(false);
    }).catch(() => alive && setLoading(false));
    return () => {
      alive = false;
      window.removeEventListener('storage', onRefresh);
      window.removeEventListener('altroshop:refresh', onRefresh);
    };
  }, []);

  return (
    <main className="page">
      <div className="container">
        <section className="hero">
          <div className="hero-label">AltroShop · Community Marketplace</div>
          {user ? (
            <>
              <h1>안녕하세요,<br />{user.name}님.</h1>
              <p>새 상품을 등록하거나 다른 사용자들의 상품을 둘러보세요. 보유 코인 <strong style={{color:'var(--accent)'}}>◈ {Number(user.coins || 0).toLocaleString()}</strong></p>
              <div className="hero-btns">
                <Link href="/upload" className="btn btn-primary">+ 상품 등록</Link>
                <Link href="/cart" className="btn">🛒 장바구니</Link>
                {user.isAdmin && <Link href="/admin" className="btn btn-admin">관리자 패널</Link>}
              </div>
            </>
          ) : (
            <>
              <h1>당신의 상품,<br />당신만의 가게.</h1>
              <p>사진과 설명만으로 상품을 등록하고, 댓글과 좋아요로 소통하며, 내부 코인으로 거래하는 커뮤니티 쇼핑몰. <strong>AltroBoard 계정도 그대로 사용</strong> 가능합니다.</p>
              <div className="hero-btns">
                <Link href="/login" className="btn btn-primary">로그인 / 가입</Link>
                <Link href="/upload" className="btn">상품 둘러보기 시작</Link>
              </div>
            </>
          )}
        </section>

        <div className="section-header">
          <div>
            <h2>전체 상품</h2>
            <p>{loading ? '불러오는 중...' : `${products.length}개의 상품`}</p>
          </div>
        </div>

        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="empty">
            아직 등록된 상품이 없습니다.<br />
            <Link href="/upload" style={{ color: 'var(--accent)', fontWeight: 700 }}>첫 상품을 등록</Link>해보세요.
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <Link key={p.id} href={`/product/${p.id}`} className="product-card">
                <div className="product-thumb">
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
                </div>
                <div className="product-body">
                  <div className="product-name">{p.name}</div>
                  <div className="product-seller">@{p.sellerName}</div>
                  <div className="product-price">
                    {Number(p.price).toLocaleString()}<span className="coin-suffix">코인</span>
                  </div>
                  <div className="product-meta">
                    <span>♡ {p.likeCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
