'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listProductsBySeller, deleteProduct, getUser, listCoinRequests } from '@/lib/shop';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async (uid: string) => {
    const [ps, fresh, reqs] = await Promise.all([
      listProductsBySeller(uid),
      getUser(uid),
      listCoinRequests({ userId: uid }),
    ]);
    setProducts(ps);
    setRequests(reqs);
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
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?\n(댓글/좋아요도 함께 삭제됩니다)`)) return;
    await deleteProduct(pid);
    await refresh(user.id);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  if (!user) return <main className="page"><div className="container">리디렉트 중...</div></main>;

  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <main className="page">
      <div className="container">
        {/* 프로필 헤더 */}
        <div className="card card-accent" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {(user.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--ink)' }}>
                {user.name}
                {user.isAdmin && <span className="badge badge-green" style={{ marginLeft: '.5rem', fontSize: '.65rem' }}>👑 관리자</span>}
              </h2>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--muted)', marginTop: '.3rem' }}>{user.email}</p>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
                <span className="coin-pill">◈ {Number(user.coins || 0).toLocaleString()} 코인</span>
                <span className="badge">등록 상품 {products.length}개</span>
                {pending > 0 && <span className="badge badge-gold">충전 요청 {pending}건 대기</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <Link href="/coin-request" className="btn btn-primary">💰 코인 충전 요청</Link>
              <Link href="/upload" className="btn">+ 상품 등록</Link>
            </div>
          </div>
        </div>

        {/* 내 코인 요청 내역 */}
        {requests.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', marginBottom: '.85rem' }}>💰 내 충전 요청 내역</h3>
            <div>
              {requests.slice(0, 5).map(r => (
                <div className="user-row" key={r.id} style={{ padding: '.65rem .5rem' }}>
                  <div className="user-row-info">
                    <div className="name" style={{ fontSize: '.92rem' }}>
                      {Number(r.amount).toLocaleString()} 코인
                      <span className={`badge ${
                        r.status === 'approved' ? 'badge-green' :
                        r.status === 'rejected' ? 'badge-red' : 'badge-gold'
                      }`} style={{ marginLeft: '.5rem' }}>
                        {r.status === 'pending' ? '대기 중' : r.status === 'approved' ? '승인됨' : '거절됨'}
                      </span>
                    </div>
                    <div className="email" style={{ marginTop: '.2rem' }}>
                      {fmt(r.createdAt)}{r.message ? ` · "${r.message.slice(0, 40)}${r.message.length > 40 ? '…' : ''}"` : ''}
                    </div>
                    {r.adminReply && (
                      <div style={{ marginTop: '.35rem', padding: '.4rem .55rem', background: 'var(--surface2)', borderRadius: 2, fontSize: '.78rem', color: 'var(--muted)' }}>
                        💬 관리자 답변: {r.adminReply}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 내가 등록한 상품 */}
        <div className="section-header">
          <div>
            <h2>📦 내가 등록한 상품</h2>
            <p>{loading ? '불러오는 중...' : `${products.length}개`}</p>
          </div>
        </div>

        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="empty">
            아직 등록한 상품이 없습니다.<br />
            <Link href="/upload" style={{ color: 'var(--accent)', fontWeight: 700 }}>첫 상품 등록하기 →</Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" style={{ cursor: 'default' }}>
                <Link href={`/product/${p.id}`} className="product-thumb">
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
                </Link>
                <div className="product-body">
                  <Link href={`/product/${p.id}`} className="product-name" style={{ color: 'inherit' }}>{p.name}</Link>
                  <div className="product-price">
                    {Number(p.price).toLocaleString()}<span className="coin-suffix">코인</span>
                  </div>
                  <div className="product-meta">
                    <span>♡ {p.likeCount}</span>
                    <span>{fmt(p.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', marginTop: '.6rem' }}>
                    <Link href={`/product/${p.id}/edit`} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      수정
                    </Link>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(p.id, p.name)}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
