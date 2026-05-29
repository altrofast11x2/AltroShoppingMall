'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCoinRequest, listCoinRequests } from '@/lib/shop';

const PRESETS = [10000, 30000, 50000, 100000];

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
    if (s.isAdmin) { router.replace('/admin'); return; } // 관리자는 본인에게 충전 요청 불필요
    setUser(s);
    refresh(s.id);
  }, [router]);

  const submit = async () => {
    setErr(''); setSuccess('');
    const n = parseInt(amount, 10);
    if (!n || n < 1) { setErr('충전 금액을 입력해주세요'); return; }
    if (n > 1000000) { setErr('한 번에 100만 코인까지만 요청 가능합니다'); return; }
    if (!message.trim()) { setErr('관리자에게 보낼 메시지를 입력해주세요'); return; }

    setBusy(true);
    try {
      await createCoinRequest({
        userId: user.id, userName: user.name, userEmail: user.email,
        amount: n, message: message.trim(),
      });
      setSuccess(`${n.toLocaleString()}코인 (${n.toLocaleString()}원) 충전 요청을 관리자에게 보냈습니다`);
      setAmount('');
      setMessage('');
      await refresh(user.id);
    } catch (e: any) {
      setErr(e?.message || '요청 실패');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <main className="bj-main">리디렉트 중...</main>;

  const fmt = (iso: string) => new Date(iso).toLocaleString('ko-KR');
  const pending = requests.filter(r => r.status === 'pending');

  return (
    <main className="bj-main" style={{ maxWidth: 760 }}>
      <Link href="/profile" className="bj-back-link">← 프로필로</Link>

      <h1 className="bj-page-title">코인 충전 요청</h1>
      <p className="bj-page-sub">
        <strong style={{ color: 'var(--text)' }}>10,000 코인 = 10,000원</strong> · 관리자가 메시지를 보고 직접 충전 처리합니다
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 20 }}>
        <span style={{ color: 'var(--muted)' }}>현재 보유</span>
        <strong>◈ {Number(user.coins || 0).toLocaleString()} 코인</strong>
      </div>

      <div className="bj-admin-card" style={{ marginBottom: 20 }}>
        {err && <div className="bj-alert bj-alert-error">{err}</div>}
        {success && <div className="bj-alert bj-alert-success">{success}</div>}

        <div className="bj-field">
          <label>충전 금액 (원)</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p}
                className="bj-btn bj-btn-sm"
                onClick={() => setAmount(String(p))}
                style={{ flex: 1, minWidth: 70 }}
              >
                {(p / 10000)}만원
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="직접 입력 (예: 10000)"
            min={1}
            max={1000000}
          />
          {amount && parseInt(amount) > 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              충전 후 잔액: <strong style={{ color: 'var(--text)' }}>
                ◈ {(Number(user.coins || 0) + parseInt(amount)).toLocaleString()} 코인
              </strong> (= {(Number(user.coins || 0) + parseInt(amount)).toLocaleString()}원)
            </p>
          )}
        </div>

        <div className="bj-field">
          <label>관리자에게 보낼 메시지</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            placeholder="예) 처음 가입했는데 마음에 드는 상품이 있어서 충전 부탁드립니다. 입금 인증샷도 함께 올렸어요."
            style={{ minHeight: 120 }}
          />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>{message.length}/500</p>
        </div>

        <button className="bj-btn bj-btn-primary bj-btn-block" onClick={submit} disabled={busy}>
          {busy ? '전송 중...' : '관리자에게 충전 요청 보내기'}
        </button>

        <div className="bj-notice">
          <strong>안내</strong><br />
          10,000코인 = 10,000원 (1:1 환산)<br />
          관리자 확인 후 직접 충전 처리됩니다<br />
          입금/송금 확인용 메시지를 자세히 적어주세요
        </div>
      </div>

      <div className="bj-admin-card">
        <h3>내가 보낸 요청 ({requests.length}건{pending.length > 0 ? ` · 대기 ${pending.length}건` : ''})</h3>
        {requests.length === 0 ? (
          <div className="bj-empty" style={{ padding: '32px 0' }}>아직 보낸 요청이 없습니다.</div>
        ) : (
          requests.map(r => (
            <div key={r.id} className="bj-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <strong style={{ fontSize: 15 }}>◈ {Number(r.amount).toLocaleString()}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>= {Number(r.amount).toLocaleString()}원</span>
                </div>
                <span className={`bj-badge ${r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'gold'}`}>
                  {r.status === 'pending' ? '대기 중' : r.status === 'approved' ? '승인됨' : '거절됨'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{fmt(r.createdAt)}</div>
              <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6, fontSize: 13 }}>
                {r.message}
              </div>
              {r.adminReply && (
                <div style={{ marginTop: 6, padding: '8px 10px', background: '#ecfdf3', borderRadius: 6, fontSize: 13, color: '#047857' }}>
                  <strong>관리자:</strong> {r.adminReply}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
