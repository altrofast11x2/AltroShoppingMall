'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCoinRequest, listCoinRequests } from '@/lib/shop';

export default function CoinRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async (uid: string) => {
    const list = await listCoinRequests({ userId: uid });
    setRequests(list);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const s = JSON.parse(raw);
    setUser(s);
    refresh(s.id);
  }, [router]);

  const submit = async () => {
    setErr(''); setSuccess('');
    const n = parseInt(amount, 10);
    if (!n || n < 1) { setErr('1 이상의 금액을 입력해주세요'); return; }
    if (n > 1000000) { setErr('한 번에 100만 코인까지만 요청 가능합니다'); return; }
    if (!message.trim()) { setErr('관리자에게 보낼 메시지를 입력해주세요'); return; }

    setBusy(true);
    try {
      await createCoinRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: n,
        message: message.trim(),
      });
      setSuccess(`✅ ${n.toLocaleString()} 코인 충전 요청이 관리자에게 전송되었습니다`);
      setAmount('');
      setMessage('');
      await refresh(user.id);
    } catch (e: any) {
      setErr(e?.message || '요청 실패');
    } finally {
      setBusy(false);
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  if (!user) return <main className="page"><div className="container">리디렉트 중...</div></main>;

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <Link href="/profile" className="back-link">← 프로필로</Link>

        <div className="section-header">
          <div>
            <h2>💰 관리자에게 코인 충전 요청</h2>
            <p>금액과 메시지를 작성하면 관리자에게 직접 전달됩니다</p>
          </div>
          <span className="coin-pill">현재 보유: ◈ {Number(user.coins || 0).toLocaleString()} 코인</span>
        </div>

        <div className="card card-accent" style={{ marginBottom: '1.5rem' }}>
          {err && <div className="alert alert-error">{err}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label>요청 코인 금액</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="예) 1000"
              min={1}
              max={1000000}
            />
          </div>

          <div className="form-group">
            <label>관리자에게 보낼 메시지 (필수)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              placeholder="예) 오늘 처음 가입했는데 마음에 드는 상품이 있어서 충전 부탁드립니다. 감사합니다 :)"
              style={{ minHeight: 120 }}
            />
            <p style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: 'var(--muted)', marginTop: '.35rem' }}>
              {message.length} / 500자
            </p>
          </div>

          <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
            {busy ? '전송 중...' : '📩 관리자에게 충전 요청 보내기'}
          </button>
        </div>

        {/* 내가 보낸 요청 내역 */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            📨 내가 보낸 요청 ({requests.length}건{pending.length > 0 ? ` · 대기 ${pending.length}건` : ''})
          </h3>
          {requests.length === 0 ? (
            <div className="empty">아직 보낸 요청이 없습니다.</div>
          ) : (
            <div>
              {requests.map(r => (
                <div className="user-row" key={r.id} style={{ alignItems: 'flex-start' }}>
                  <div className="user-row-info">
                    <div className="name">
                      💰 {Number(r.amount).toLocaleString()} 코인
                      <span className={`badge ${
                        r.status === 'approved' ? 'badge-green' :
                        r.status === 'rejected' ? 'badge-red' : 'badge-gold'
                      }`} style={{ marginLeft: '.5rem' }}>
                        {r.status === 'pending' ? '⏳ 대기 중' : r.status === 'approved' ? '✅ 승인됨' : '❌ 거절됨'}
                      </span>
                    </div>
                    <div className="email" style={{ marginTop: '.25rem' }}>{fmt(r.createdAt)}</div>
                    <div style={{ marginTop: '.5rem', padding: '.55rem .7rem', background: 'var(--bg)', borderRadius: 2, fontSize: '.85rem', borderLeft: '3px solid var(--accent)' }}>
                      {r.message}
                    </div>
                    {r.adminReply && (
                      <div style={{ marginTop: '.5rem', padding: '.55rem .7rem', background: 'rgba(26,110,58,0.08)', borderRadius: 2, fontSize: '.85rem', borderLeft: '3px solid var(--admin)' }}>
                        <strong style={{color:'var(--admin)'}}>👑 관리자 답변:</strong> {r.adminReply}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
