'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listUsers, listProducts, listOrders, updateUserCoins, getUser,
  listCoinRequests, approveCoinRequest, rejectCoinRequest, approveRefund,
} from '@/lib/shop';

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coinRequests, setCoinRequests] = useState<any[]>([]);
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = async () => {
    const [u, p, o, cr] = await Promise.all([listUsers(), listProducts(), listOrders(), listCoinRequests()]);
    setUsers(u.filter((x: any) => !x.isAdmin));
    setProducts(p);
    setOrders(o);
    setCoinRequests(cr);
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const s = JSON.parse(raw);
    if (!s.isAdmin) { alert('관리자만 접근 가능합니다'); router.replace('/'); return; }
    setMe(s);
    refresh();
  }, [router]);

  const onAddCoins = async (uid: string, name: string) => {
    const raw = addAmounts[uid] || '';
    const amount = parseInt(raw, 10);
    if (!amount || amount < 1) { setMsg('1 이상의 숫자를 입력해주세요'); return; }
    const cur = await getUser(uid);
    if (!cur) return;
    await updateUserCoins(uid, (cur.coins || 0) + amount);
    setMsg(`${name}님에게 ${amount.toLocaleString()}원 충전 (잔액: ${(cur.coins + amount).toLocaleString()}원)`);
    setAddAmounts({ ...addAmounts, [uid]: '' });
    await refresh();
  };

  const onSetCoins = async (uid: string, name: string) => {
    const raw = addAmounts[uid] || '';
    const amount = parseInt(raw, 10);
    if (isNaN(amount) || amount < 0) { setMsg('0 이상의 숫자를 입력해주세요'); return; }
    if (!confirm(`${name}님의 코인을 ${amount.toLocaleString()}원으로 덮어쓸까요?`)) return;
    await updateUserCoins(uid, amount);
    setMsg(`${name}님 코인 ${amount.toLocaleString()}원으로 설정 완료`);
    setAddAmounts({ ...addAmounts, [uid]: '' });
    await refresh();
  };

  const onApproveRequest = async (reqId: string, userName: string, amount: number) => {
    const reply = adminReplies[reqId] || '';
    if (!confirm(`${userName}님에게 ${amount.toLocaleString()}원 지급?`)) return;
    const r = await approveCoinRequest(reqId, reply);
    if ((r as any).error) { setMsg('' + (r as any).error); return; }
    setMsg(`${userName}님께 ${amount.toLocaleString()}원 지급 완료`);
    setAdminReplies({ ...adminReplies, [reqId]: '' });
    await refresh();
  };

  const onRejectRequest = async (reqId: string, userName: string) => {
    const reply = adminReplies[reqId] || '';
    if (!reply.trim()) { setMsg('거절 시 사유 입력 필수'); return; }
    if (!confirm(`${userName}님의 요청을 거절?`)) return;
    const r = await rejectCoinRequest(reqId, reply);
    if ((r as any).error) { setMsg('' + (r as any).error); return; }
    setMsg(`요청 거절 처리됨`);
    setAdminReplies({ ...adminReplies, [reqId]: '' });
    await refresh();
  };

  const onApproveRefund = async (orderId: string, buyerName: string) => {
    const reply = adminReplies[orderId] || '';
    if (!confirm(`${buyerName}님 환불 승인 (코인 반환)?`)) return;
    const r = await approveRefund(orderId, reply);
    if ((r as any).error) { setMsg('' + (r as any).error); return; }
    setMsg(`환불 처리 완료`);
    setAdminReplies({ ...adminReplies, [orderId]: '' });
    await refresh();
  };

  if (!me) return <main className="bj-main">리디렉트 중...</main>;

  const totalCoins = users.reduce((s, u) => s + (u.coins || 0), 0);
  const pendingList = coinRequests.filter((r: any) => r.status === 'pending');
  const refundList = orders.filter((o: any) => o.status === 'refund_requested');

  return (
    <main className="bj-main">
      <h1 className="bj-page-title">관리자 대시보드</h1>
      <p className="bj-page-sub">충전 요청 처리 · 환불 처리 · 사용자 코인 관리</p>

      {msg && <div className={`bj-alert ${/완료|지급|처리/.test(msg) ? 'bj-alert-success' : 'bj-alert-error'}`}>{msg}</div>}

      <div className="bj-stats">
        <div className="bj-stat"><div className="bj-stat-label">사용자</div><div className="bj-stat-value">{users.length}</div></div>
        <div className="bj-stat"><div className="bj-stat-label">상품</div><div className="bj-stat-value">{products.length}</div></div>
        <div className={`bj-stat ${pendingList.length > 0 ? 'alert' : ''}`}>
          <div className="bj-stat-label">충전 요청{pendingList.length > 0 ? ' (대기)' : ''}</div>
          <div className="bj-stat-value">{pendingList.length}</div>
        </div>
        <div className={`bj-stat ${refundList.length > 0 ? 'alert' : ''}`}>
          <div className="bj-stat-label">환불 요청{refundList.length > 0 ? ' (대기)' : ''}</div>
          <div className="bj-stat-value">{refundList.length}</div>
        </div>
      </div>

      {/* 환불 요청 */}
      {refundList.length > 0 && (
        <div className="bj-admin-card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
          <h3 style={{ color: 'var(--accent)' }}>환불 요청 ({refundList.length}건)</h3>
          {refundList.map((o: any) => (
            <div key={o.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{o.buyerName}</strong>
                <strong style={{ color: 'var(--accent)' }}>{Number(o.total).toLocaleString()}원</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {(o.items || []).map((it: any) => it.name).join(', ')}
              </div>
              <div className="bj-notice" style={{ marginBottom: 8 }}>
                <strong>환불 사유:</strong> {o.refundReason}
              </div>
              <input
                type="text"
                placeholder="답변 메시지 (선택)"
                value={adminReplies[o.id] || ''}
                onChange={e => setAdminReplies({ ...adminReplies, [o.id]: e.target.value })}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid transparent', padding: 8, borderRadius: 6, fontSize: 13, marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="bj-btn bj-btn-primary bj-btn-sm" onClick={() => onApproveRefund(o.id, o.buyerName)}>환불 승인 + 코인 반환</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 코인 충전 요청 */}
      {pendingList.length > 0 && (
        <div className="bj-admin-card" style={{ marginBottom: 20 }}>
          <h3>대기 중인 충전 요청 ({pendingList.length}건)</h3>
          {pendingList.map((r: any) => (
            <div key={r.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{r.userName}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>{r.userEmail}</span>
                </div>
                <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{Number(r.amount).toLocaleString()}원</strong>
              </div>
              <div className="bj-notice" style={{ marginBottom: 8 }}>{r.message}</div>
              <input
                type="text"
                placeholder="답변 (선택, 거절 시 필수)"
                value={adminReplies[r.id] || ''}
                onChange={e => setAdminReplies({ ...adminReplies, [r.id]: e.target.value })}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid transparent', padding: 8, borderRadius: 6, fontSize: 13, marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="bj-btn bj-btn-danger bj-btn-sm" onClick={() => onRejectRequest(r.id, r.userName)}>거절</button>
                <button className="bj-btn bj-btn-primary bj-btn-sm" onClick={() => onApproveRequest(r.id, r.userName, r.amount)}>승인 + 즉시 지급</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bj-admin-grid">
        <div className="bj-admin-card">
          <h3>사용자 코인 관리</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>+ 충전: 현재값에 더하기 / 설정: 입력값으로 덮어쓰기 (1코인=1원)</p>
          {loading ? <div className="bj-empty">불러오는 중...</div> :
           users.length === 0 ? <div className="bj-empty">등록된 사용자가 없습니다</div> :
           users.map((u: any) => (
            <div className="bj-row" key={u.id}>
              <div className="bj-row-info">
                <div className="name">{u.name}</div>
                <div className="meta">{u.email} · ◈ {(u.coins || 0).toLocaleString()}</div>
              </div>
              <div className="bj-row-actions">
                <input
                  type="number"
                  placeholder="금액"
                  min={0}
                  value={addAmounts[u.id] || ''}
                  onChange={e => setAddAmounts({ ...addAmounts, [u.id]: e.target.value })}
                />
                <button className="bj-btn bj-btn-primary bj-btn-sm" onClick={() => onAddCoins(u.id, u.name)}>+ 충전</button>
                <button className="bj-btn bj-btn-sm" onClick={() => onSetCoins(u.id, u.name)}>설정</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bj-admin-card">
          <h3>최근 안전결제 내역 (10건)</h3>
          {orders.length === 0 ? <div className="bj-empty">결제 내역 없음</div> :
           orders.slice(0, 10).map((o: any) => {
            const buyer = users.find((u: any) => u.id === o.userId);
            const statusTxt = o.status === 'in_escrow' ? '에스크로' : o.status === 'completed' ? '완료' : o.status === 'refund_requested' ? '환불요청' : '환불됨';
            return (
              <div className="bj-row" key={o.id}>
                <div className="bj-row-info">
                  <div className="name">{buyer?.name || o.buyerName || '-'}</div>
                  <div className="meta">{new Date(o.date).toLocaleString('ko-KR')} · {o.items?.length || 0}개 · <span className="bj-badge">{statusTxt}</span></div>
                </div>
                <strong style={{ color: 'var(--accent)' }}>{Number(o.total).toLocaleString()}원</strong>
              </div>
            );
          })}
          <div className="bj-row" style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
            <div>총 유통 코인</div>
            <strong>{totalCoins.toLocaleString()}원</strong>
          </div>
        </div>
      </div>
    </main>
  );
}
