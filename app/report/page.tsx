'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createReport } from '@/lib/shop';

export const dynamic = 'force-dynamic';

const REASONS = [
  '허위 매물 / 사기 의심',
  '부적절한 상품 / 게시물',
  '욕설 / 비방 댓글',
  '저작권 / 도용',
  '결제 / 정산 문제',
  '기타',
];

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="bj-main bj-empty">불러오는 중...</main>}>
      <Report />
    </Suspense>
  );
}

function Report() {
  const router = useRouter();
  const sp = useSearchParams();
  const targetType = sp.get('type') || 'general';
  const targetId = sp.get('id') || '';
  const targetName = sp.get('name') || '';

  const [user, setUser] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('altroshop_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const submit = async () => {
    setErr('');
    if (!reason) { setErr('신고 사유를 선택해주세요'); return; }
    if (!detail.trim()) { setErr('신고 내용을 입력해주세요'); return; }
    setBusy(true);
    try {
      await createReport({
        reporterId: user?.id, reporterName: user?.name,
        targetType, targetId, targetName,
        reason, detail: detail.trim(),
      });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message || '신고 접수 실패');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="bj-main" style={{ maxWidth: 600 }}>
        <div className="bj-admin-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <h2 className="bj-page-title" style={{ marginBottom: 8 }}>신고가 접수되었습니다</h2>
          <p className="bj-page-sub">AltroShop 관리자가 확인 후 조치합니다. 소중한 제보 감사합니다.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <Link href="/" className="bj-btn">홈으로</Link>
            <button className="bj-btn bj-btn-primary" onClick={() => { setDone(false); setReason(''); setDetail(''); }}>추가 신고</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bj-main" style={{ maxWidth: 600 }}>
      <button className="bj-back-link" onClick={() => router.back()}>← 뒤로</button>
      <h1 className="bj-page-title">문제 신고</h1>
      <p className="bj-page-sub">AltroShop 내에서 직접 신고할 수 있습니다. 관리자가 확인 후 처리합니다.</p>

      <div className="bj-admin-card">
        {err && <div className="bj-alert bj-alert-error">{err}</div>}

        {targetName && (
          <div className="bj-notice" style={{ marginBottom: 14 }}>
            <strong>신고 대상:</strong> {targetType === 'product' ? '상품' : '대상'} · {targetName}
          </div>
        )}

        <div className="bj-field">
          <label>신고 사유</label>
          <select className="bj-select" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">사유 선택</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="bj-field">
          <label>상세 내용</label>
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            maxLength={1000}
            placeholder="어떤 문제가 있었는지 구체적으로 적어주세요. (거래 일시, 상황 등)"
            style={{ minHeight: 140 }}
          />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>{detail.length}/1000</p>
        </div>

        {!user && (
          <div className="bj-notice" style={{ marginBottom: 14 }}>
            비로그인 상태로 신고됩니다. <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>로그인</Link> 하면 처리 결과를 추적할 수 있어요.
          </div>
        )}

        <button className="bj-btn bj-btn-primary bj-btn-block" onClick={submit} disabled={busy}>
          {busy ? '접수 중...' : '신고 접수'}
        </button>
      </div>
    </main>
  );
}
