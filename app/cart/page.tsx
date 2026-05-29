'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCart, getProduct, setCartQty, removeFromCart, clearCart, checkout, getUser,
} from '@/lib/shop';

type CartLine = { productId: string; qty: number; product?: any };

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);

  const refresh = async (uid: string) => {
    const cart = await getCart(uid);
    const items: CartLine[] = [];
    for (const c of cart) {
      const p = await getProduct(c.productId);
      if (p) items.push({ productId: c.productId, qty: c.qty, product: p });
    }
    setLines(items);
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
    if (!enough) {
      setMsg('❌ 코인이 부족합니다.');
      return;
    }
    setConfirmModal(true);
  };

  const doCheckout = async () => {
    setBusy(true);
    setMsg('');
    const r = await checkout(user.id);
    if ((r as any).error) {
      setMsg('❌ ' + (r as any).error);
      setBusy(false);
      setConfirmModal(false);
      return;
    }
    setConfirmModal(false);
    setMsg(`✅ 안전결제 완료! ${total.toLocaleString()}원 차감 / 잔액 ${(r as any).remaining.toLocaleString()}원`);
    await refresh(user.id);
    window.dispatchEvent(new Event('altroshop:refresh'));
    setBusy(false);
  };

  if (!user) return <main className="bj-main">리디렉트 중...</main>;

  return (
    <main className="bj-main">
      <h1 className="bj-page-title">장바구니</h1>
      <p className="bj-page-sub">{loading ? '불러오는 중...' : `${lines.length}개 상품 / 안전결제 적용`}</p>

      {msg && <div className={`bj-alert ${msg.startsWith('✅') ? 'bj-alert-success' : 'bj-alert-error'}`}>{msg}</div>}

      {loading ? (
        <div className="bj-empty">불러오는 중...</div>
      ) : lines.length === 0 ? (
        <div className="bj-empty">
          장바구니가 비어있습니다.<br />
          <Link href="/">상품 둘러보기 →</Link>
        </div>
      ) : (
        <>
          <div className="bj-cart-list">
            {lines.map(l => {
              const subtotal = (l.product?.price || 0) * l.qty;
              return (
                <div className="bj-cart-row" key={l.productId}>
                  <Link href={`/product/${l.productId}`}>
                    {l.product?.image
                      ? <img src={l.product.image} alt={l.product.name}/>
                      : <div style={{ width: 100, height: 100, background: 'var(--surface2)' }}/>}
                  </Link>
                  <div>
                    <h4><Link href={`/product/${l.productId}`}>{l.product?.name || '(삭제된 상품)'}</Link></h4>
                    <div className="meta">@{l.product?.sellerName}</div>
                    <div className="price" style={{ marginTop: 8 }}>
                      {subtotal.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bj-qty">
                    <button onClick={() => onQty(l.productId, -1)}>−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => onQty(l.productId, 1)}>+</button>
                  </div>
                  <button className="bj-btn bj-btn-sm" onClick={() => onRemove(l.productId)}>삭제</button>
                </div>
              );
            })}
          </div>

          <div className="bj-cart-summary">
            <div>
              <div className="bj-cart-total-label">총 결제 금액 (보유: {Number(user.coins || 0).toLocaleString()}코인)</div>
              <div className="bj-cart-total">{total.toLocaleString()}원</div>
              {!enough && (
                <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 6 }}>
                  {(total - (user.coins || 0)).toLocaleString()}원 부족 ·{' '}
                  <Link href="/coin-request" style={{ textDecoration: 'underline' }}>코인 충전 요청</Link>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="bj-btn" onClick={onClear} disabled={busy}>전체 비우기</button>
              <button className="bj-btn bj-btn-primary" onClick={onCheckout} disabled={busy || !enough}>
                {busy ? '결제 중...' : '🛡️ 안전결제'}
              </button>
            </div>
          </div>

          <div className="bj-notice">
            <strong>안전결제 안내</strong><br />
            결제 즉시 코인이 차감되어 보관됩니다. 상품 수령 후 <Link href="/orders" style={{ color: 'var(--accent)' }}>구매내역</Link> 에서 <strong>구매 확정</strong>하면 판매자에게 정산됩니다.
            문제 시 환불 요청 → 관리자가 처리합니다.
          </div>
        </>
      )}

      {/* 결제 확인 모달 */}
      {confirmModal && (
        <div className="bj-modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="bj-modal" onClick={e => e.stopPropagation()}>
            <h3 className="bj-modal-title">🛡️ 안전결제 진행</h3>
            <div className="bj-modal-body">
              <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>총 결제 금액</span>
                  <strong style={{ fontSize: 18, color: 'var(--accent)' }}>{total.toLocaleString()}원</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>
                  <span>차감 코인</span>
                  <span>{total.toLocaleString()}코인</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>
                  <span>결제 후 잔액</span>
                  <span>{((user.coins || 0) - total).toLocaleString()}코인</span>
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
                결제 시 코인이 즉시 차감됩니다. 상품을 받으신 후<br />
                <strong>구매내역에서 "구매 확정"</strong>을 눌러주세요.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="bj-btn bj-btn-block" onClick={() => setConfirmModal(false)} disabled={busy}>취소</button>
              <button className="bj-btn bj-btn-primary bj-btn-block" onClick={doCheckout} disabled={busy}>
                {busy ? '결제 중...' : '결제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
