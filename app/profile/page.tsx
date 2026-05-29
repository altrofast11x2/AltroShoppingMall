'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listProductsBySeller, deleteProduct, getUser } from '@/lib/shop';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async (uid: string) => {
    const [ps, fresh] = await Promise.all([listProductsBySeller(uid), getUser(uid)]);
    setProducts(ps);
    if (fresh) {
      const raw = localStorage.getItem('altroshop_user');
      const cur = raw ? JSON.parse(raw) : {};
      const merged = { ...cur, coins: fresh.coins };
      localStorage.setItem('altroshop_user', JSON.stringify(merged));
      setUser(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const s = JSON.parse(raw);
    setUser(s);
    refresh(s.id);
  }, [router]);

  const onDelete = async (pid: string, name: string) => {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return;
    await deleteProduct(pid);
    await refresh(user.id);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return h + '시간 전';
    const d = Math.floor(h / 24);
    return d + '일 전';
  };

  if (!user) return <main className="bj-main">리디렉트 중...</main>;

  return (
    <main className="bj-main">
      {/* 프로필 카드 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--text)', color: '#fff',
          fontSize: 28, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{(user.name || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {user.name}
            {user.isAdmin && <span className="bj-badge green" style={{ marginLeft: 8 }}>관리자</span>}
          </h2>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="bj-badge gold">◈ {Number(user.coins || 0).toLocaleString()} 코인</span>
            <span className="bj-badge">등록 상품 {products.length}개</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/coin-request" className="bj-btn">코인 충전</Link>
          <Link href="/orders" className="bj-btn">구매내역</Link>
          <Link href="/upload" className="bj-btn bj-btn-primary">+ 상품 등록</Link>
        </div>
      </div>

      <div className="bj-section-head">
        <h2 className="bj-section-title">내가 등록한 상품</h2>
        <span className="bj-section-link">{products.length}개</span>
      </div>

      {loading ? (
        <div className="bj-empty">불러오는 중...</div>
      ) : products.length === 0 ? (
        <div className="bj-empty">
          아직 등록한 상품이 없습니다.<br />
          <Link href="/upload">첫 상품 등록하기 →</Link>
        </div>
      ) : (
        <div className="bj-grid">
          {products.map(p => (
            <div key={p.id} className="bj-card" style={{ cursor: 'default' }}>
              <Link href={`/product/${p.id}`} className="bj-card-img">
                {p.image && <img src={p.image} alt={p.name} loading="lazy"/>}
              </Link>
              <div className="bj-card-body">
                <div className="bj-card-price">{Number(p.price).toLocaleString()}원</div>
                <Link href={`/product/${p.id}`} className="bj-card-name" style={{ color: 'inherit' }}>{p.name}</Link>
                <div className="bj-card-meta">
                  <span>{timeAgo(p.createdAt)}</span>
                  <span className="bj-card-meta-dot"/>
                  <span>♡ {p.likeCount}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  <Link href={`/product/${p.id}/edit`} className="bj-btn bj-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>수정</Link>
                  <button className="bj-btn bj-btn-sm bj-btn-danger" onClick={() => onDelete(p.id, p.name)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
