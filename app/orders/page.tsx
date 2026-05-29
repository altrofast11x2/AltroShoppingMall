'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listOrders, confirmOrder, requestRefund } from '@/lib/shop';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = async (uid: string) => {
    const list = await listOrders(uid);
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const s = JSON.parse(raw);
    setUser(s);
    refresh(s.id);
  }, [router]);

  const onConfirm = async (orderId: string) => {
    if (!confirm('상품을 정상적으로 받으셨나요?\n구매 확정 시 판매자에게 코인이 지급되며 되돌릴 수 없습니다.')) return;
    const r = await confirmOrder(orderId, user.id);
    if ((r as any).error) { setMsg('❌ ' + (r as any).error); return; }
    setMsg('✅ 구매 확정 완료. 판매자에게 정산되었습니다.');
    window.dispatchEvent(new Event('altroshop:refresh'));
    await refresh(user.id);
  };

  const onRefund = async (orderId: string) => {
    const reason = prompt('환불 사유를 입력해주세요:');
    if (!reason || !reason.trim()) return;
    const r = await requestRefund(orderId, user.id, reason.trim());
    if ((r as any).error) { setMsg('❌ ' + (r as any).error); return; }
    setMsg('✅ 환불 요청을 보냈습니다. 관리자가 처리합니다.');
    await refresh(user.id);
  };

  if (!user) return <main className="bj-main">리디렉트 중...</main>;

  const fmt = (iso: string) => new Date(iso).toLocaleString('ko-KR');

  const statusLabel = (s: string) => {
    if (s === 'in_escrow') return { text: '결제 완료 · 수령 대기', cls: 'gold' };
    if (s === 'completed') return { text: '구매 확정', cls: 'green' };
    if (s === 'refund_requested') return { text: '환불 요청 중', cls: 'red' };
    if (s === 'refunded') return { text: '환불 완료', cls: 'blue' };
    return { text: s, cls: '' };
  };

  return (
    <main className="bj-main">
      <h1 className="bj-page-title">구매내역</h1>
      <p className="bj-page-sub">안전결제 / 구매 확정 / 환불 요청</p>

      {msg && <div className={`bj-alert ${msg.startsWith('✅') ? 'bj-alert-success' : 'bj-alert-error'}`}>{msg}</div>}

      {loading ? (
        <div className="bj-empty">불러오는 중...</div>
      ) : orders.length === 0 ? (
        <div className="bj-empty">구매내역이 없습니다.<br /><Link href="/">상품 둘러보기 →</Link></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(o => {
            const st = statusLabel(o.status || 'in_escrow');
            return (
              <div key={o.id} className="bj-admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>주문번호: {o.id.slice(-8).toUpperCase()}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmt(o.date)}</div>
                  </div>
                  <span className={`bj-badge ${st.cls}`}>{st.text}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  {(o.items || []).map((it: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {it.image && <img src={it.image} alt={it.name} style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover' }}/>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/product/${it.productId}`} style={{ fontWeight: 600, fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.name}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>판매자: {it.sellerName} · 수량 {it.qty}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{(it.price * it.qty).toLocaleString()}원</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>총 결제</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{Number(o.total).toLocaleString()}원</div>
                  </div>
                  {o.status === 'in_escrow' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="bj-btn bj-btn-danger bj-btn-sm" onClick={() => onRefund(o.id)}>환불 요청</button>
                      <button className="bj-btn bj-btn-primary bj-btn-sm" onClick={() => onConfirm(o.id)}>구매 확정</button>
                    </div>
                  )}
                </div>

                {o.refundReason && (
                  <div className="bj-notice" style={{ marginTop: 12 }}>
                    <strong>환불 사유:</strong> {o.refundReason}
                  </div>
                )}
                {o.adminReply && (
                  <div className="bj-notice" style={{ marginTop: 8, background: '#ecfdf3', color: '#047857' }}>
                    <strong>관리자 답변:</strong> {o.adminReply}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
