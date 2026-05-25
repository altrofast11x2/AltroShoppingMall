'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCart, getProduct, setCartQty, removeFromCart, clearCart, checkout, getUser,
} from '@/lib/shop';

type CartLine = {
  productId: string;
  qty: number;
  product?: any;
};

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const refresh = async (uid: string) => {
    const cart = await getCart(uid);
    const items: CartLine[] = [];
    for (const c of cart) {
      const p = await getProduct(c.productId);
      if (p) items.push({ productId: c.productId, qty: c.qty, product: p });
    }
    setLines(items);
    // 코인 잔액 새로고침
    const fresh = await getUser(uid);
    if (fresh) {
      const merged = { ...JSON.parse(localStorage.getItem('altroshop_user') || '{}'), coins: fresh.coins };
      localStorage.setItem('altroshop_user', JSON.stringify(merged));
      setUser(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const u = JSON.parse(raw);
    setUser(u);
    refresh(u.id);
  }, [router]);

  const total = lines.reduce((s, l) => s + (l.product?.price || 0) * l.qty, 0);
  const enough = (user?.coins || 0) >= total;

  const onQty = async (pid: string, delta: number) => {
    const line = lines.find(l => l.productId === pid);
    if (!line) return;
    const next = line.qty + delta;
    if (next < 1) {
      if (!confirm('이 상품을 장바구니에서 삭제할까요?')) return;
      await removeFromCart(user.id, pid);
    } else {
      await setCartQty(user.id, pid, next);
    }
    await refresh(user.id);
    window.dispatchEvent(new Event('altroshop:refresh'));
  };

  const onRemove = async (pid: string) => {
    if (!confirm('이 상품을 장바구니에서 삭제할까요?')) return;
    await removeFromCart(user.id, pid);
    await refresh(user.id);
    window.dispatchEvent(new Event('altroshop:refresh'));
  };

  const onClear = async () => {
    if (!confirm('장바구니를 모두 비울까요?')) return;
    await clearCart(user.id);
    await refresh(user.id);
    window.dispatchEvent(new Event('altroshop:refresh'));
  };

  const onCheckout = async () => {
    if (!enough) { setMsg('❌ 코인이 부족합니다. 관리자에게 충전 요청하세요.'); return; }
    if (!confirm(`총 ${total.toLocaleString()} 코인을 결제하시겠습니까?`)) return;
    setBusy(true);
    setMsg('');
    const r = await checkout(user.id);
    if ((r as any).error) {
      setMsg('❌ ' + (r as any).error);
      setBusy(false);
      return;
    }
    setMsg(`✅ 결제 완료! ${total.toLocaleString()} 코인 차감 / 잔액: ${(r as any).remaining.toLocaleString()} 코인`);
    await refresh(user.id);
    window.dispatchEvent(new Event('altroshop:refresh'));
    setBusy(false);
  };

  if (!user) return <main className="page"><div className="container">리디렉트 중...</div></main>;

  return (
    <main className="page">
      <div className="container">
        <div className="section-header">
          <div>
            <h2>장바구니</h2>
            <p>{loading ? '불러오는 중...' : `${lines.length}개의 상품`}</p>
          </div>
          <div className="coin-pill">◈ 보유 {Number(user.coins || 0).toLocaleString()} 코인</div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : lines.length === 0 ? (
          <div className="empty">
            장바구니가 비어있습니다.<br />
            <a href="/" style={{ color: 'var(--accent)', fontWeight: 700 }}>상품 둘러보기 →</a>
          </div>
        ) : (
          <>
            <div className="cart-table">
              {lines.map(l => {
                const subtotal = (l.product?.price || 0) * l.qty;
                return (
                  <div className="cart-row" key={l.productId}>
                    <a href={`/product/${l.productId}`}>
                      {l.product?.image
                        ? <img src={l.product.image} alt={l.product.name} />
                        : <div style={{ width: 90, height: 90, background: 'var(--surface2)' }} />}
                    </a>
                    <div className="cart-row-info">
                      <h4><a href={`/product/${l.productId}`} style={{ color: 'inherit' }}>{l.product?.name || '(삭제된 상품)'}</a></h4>
                      <div className="meta">@{l.product?.sellerName}</div>
                      <div className="meta">
                        <span className="price">{Number(l.product?.price || 0).toLocaleString()}</span> × {l.qty}
                        {' = '}
                        <span className="price">{subtotal.toLocaleString()} 코인</span>
                      </div>
                    </div>
                    <div className="qty-control">
                      <button onClick={() => onQty(l.productId, -1)}>−</button>
                      <span>{l.qty}</span>
                      <button onClick={() => onQty(l.productId, 1)}>+</button>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => onRemove(l.productId)}>삭제</button>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary">
              <div>
                <div className="cart-summary-label">총 결제 금액</div>
                <div className="cart-summary-total">
                  {total.toLocaleString()}<span style={{ fontSize: '1rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginLeft: '.4rem' }}>코인</span>
                </div>
                {!enough && (
                  <div style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '.75rem', marginTop: '.35rem' }}>
                    ⚠ {(total - (user.coins || 0)).toLocaleString()} 코인 부족
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn" onClick={onClear} disabled={busy}>전체 비우기</button>
                <button className="btn btn-primary" onClick={onCheckout} disabled={busy || !enough}>
                  {busy ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
