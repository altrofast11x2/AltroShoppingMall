'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listUsers, listProducts, listOrders, updateUserCoins, getUser,
} from '@/lib/shop';

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = async () => {
    const [u, p, o] = await Promise.all([listUsers(), listProducts(), listOrders()]);
    setUsers(u.filter((x: any) => !x.isAdmin));
    setProducts(p);
    setOrders(o);
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
    if (!amount || amount < 1) { setMsg('❌ 1 이상의 숫자를 입력해주세요'); return; }
    const cur = await getUser(uid);
    if (!cur) return;
    await updateUserCoins(uid, (cur.coins || 0) + amount);
    setMsg(`✅ ${name}님에게 ${amount.toLocaleString()} 코인 충전 (잔액: ${(cur.coins + amount).toLocaleString()})`);
    setAddAmounts({ ...addAmounts, [uid]: '' });
    await refresh();
  };

  const onSetCoins = async (uid: string, name: string) => {
    const raw = addAmounts[uid] || '';
    const amount = parseInt(raw, 10);
    if (isNaN(amount) || amount < 0) { setMsg('❌ 0 이상의 숫자를 입력해주세요'); return; }
    const cur = await getUser(uid);
    if (!cur) return;
    if (!confirm(`${name}님의 코인을 ${amount.toLocaleString()}로 설정할까요? (현재: ${(cur.coins || 0).toLocaleString()})`)) return;
    await updateUserCoins(uid, amount);
    setMsg(`✅ ${name}님 코인 ${amount.toLocaleString()}로 설정 완료`);
    setAddAmounts({ ...addAmounts, [uid]: '' });
    await refresh();
  };

  if (!me) return <main className="page"><div className="container">리디렉트 중...</div></main>;

  const totalCoins = users.reduce((s, u) => s + (u.coins || 0), 0);

  return (
    <main className="page">
      <div className="container">
        <div className="section-header">
          <div>
            <h2>관리자 대시보드</h2>
            <p>사용자별 코인 충전, 거래 모니터링</p>
          </div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-label">사용자</div>
            <div className="stat-value">{users.length}<span style={{ fontSize: '.85rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>명</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">상품</div>
            <div className="stat-value">{products.length}<span style={{ fontSize: '.85rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>개</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">결제 건</div>
            <div className="stat-value">{orders.length}<span style={{ fontSize: '.85rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>건</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">유통 코인</div>
            <div className="stat-value">{totalCoins.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="card">
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '.5rem' }}>👥 사용자 코인 관리</h3>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--accent)' }}>+ 충전</strong>: 현재값에 더함 / <strong style={{ color: 'var(--accent)' }}>설정</strong>: 입력값으로 덮어씀
            </p>
            {loading ? (
              <div className="empty">불러오는 중...</div>
            ) : users.length === 0 ? (
              <div className="empty">등록된 사용자가 없습니다.</div>
            ) : (
              <div>
                {users.map(u => (
                  <div className="user-row" key={u.id}>
                    <div className="user-row-info">
                      <div className="name">{u.name}</div>
                      <div className="email">{u.email}</div>
                      <div style={{ marginTop: '.3rem' }}>
                        <span className="coin-pill">◈ {(u.coins || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="user-row-actions">
                      <input
                        type="number"
                        placeholder="금액"
                        min={0}
                        value={addAmounts[u.id] || ''}
                        onChange={e => setAddAmounts({ ...addAmounts, [u.id]: e.target.value })}
                      />
                      <button className="btn btn-sm btn-primary" onClick={() => onAddCoins(u.id, u.name)}>+ 충전</button>
                      <button className="btn btn-sm" onClick={() => onSetCoins(u.id, u.name)}>설정</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem' }}>💳 최근 결제 (10건)</h3>
            {loading ? (
              <div className="empty">불러오는 중...</div>
            ) : orders.length === 0 ? (
              <div className="empty">아직 결제 내역이 없습니다.</div>
            ) : (
              <div>
                {orders.slice(0, 10).map(o => {
                  const buyer = users.find(u => u.id === o.userId);
                  return (
                    <div className="user-row" key={o.id}>
                      <div className="user-row-info">
                        <div className="name">{buyer?.name || '(관리자/탈퇴)'}</div>
                        <div className="email">{new Date(o.date).toLocaleString('ko-KR')} · 상품 {o.items?.length || 0}개</div>
                      </div>
                      <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--accent)' }}>
                        {Number(o.total).toLocaleString()} 코인
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
