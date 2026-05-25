'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser } from '@/lib/shop';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (!email || !pw) { setErr('이메일과 비밀번호를 입력해주세요'); return; }
    setBusy(true);
    try {
      if (tab === 'login') {
        const u = await loginUser(email, pw);
        if (!u) { setErr('이메일 또는 비밀번호가 일치하지 않습니다'); setBusy(false); return; }
        localStorage.setItem('altroshop_user', JSON.stringify(u));
        window.dispatchEvent(new Event('altroshop:refresh'));
        router.push('/');
      } else {
        if (!name) { setErr('이름(닉네임)을 입력해주세요'); setBusy(false); return; }
        if (pw.length < 4) { setErr('비밀번호는 4자 이상이어야 합니다'); setBusy(false); return; }
        if (pw !== pw2) { setErr('비밀번호가 일치하지 않습니다'); setBusy(false); return; }
        const r = await registerUser(name, email, pw);
        if ((r as any).error) { setErr((r as any).error); setBusy(false); return; }
        localStorage.setItem('altroshop_user', JSON.stringify(r));
        window.dispatchEvent(new Event('altroshop:refresh'));
        router.push('/');
      }
    } catch (e: any) {
      setErr(e?.message || '오류가 발생했습니다');
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <div className="login-wrap">
        <div className="login-box card card-accent">
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.25rem', color: 'var(--ink)' }}>
            AltroShop
          </h2>
          <div className="tab-row">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>로그인</button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>회원가입</button>
          </div>

          {err && <div className="alert alert-error">{err}</div>}

          {tab === 'register' && (
            <div className="form-group">
              <label>이름</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="표시될 이름" />
            </div>
          )}
          <div className="form-group">
            <label>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="비밀번호"
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          {tab === 'register' && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="다시 입력"
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
            {busy ? '처리 중...' : (tab === 'login' ? '로그인' : '가입하기')}
          </button>

          {tab === 'login' && (
            <>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--admin)', marginTop: '1rem', textAlign: 'center', padding: '.6rem', background: 'rgba(26,110,58,0.08)', border: '1px solid rgba(26,110,58,0.25)', borderRadius: 2 }}>
                ✨ <strong>AltroBoard 계정 그대로 사용 가능</strong><br />
                같은 이메일·비밀번호로 바로 로그인하세요 (첫 로그인 시 100코인 보너스)
              </p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: 'var(--muted)', marginTop: '.65rem', textAlign: 'center' }}>
                관리자: <code>altrofast11x2@email.com</code> / <code>altrofast11x2@</code>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
