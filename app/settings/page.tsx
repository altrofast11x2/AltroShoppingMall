'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && sysDark);
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = (localStorage.getItem('altroshop_theme') as Theme) || 'light';
    setTheme(t);
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('altroshop_theme', t);
    applyTheme(t);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const OPTIONS: { key: Theme; label: string; desc: string }[] = [
    { key: 'light',  label: '라이트', desc: 'AltroBoard 기본 크림 테마' },
    { key: 'dark',   label: '다크',   desc: '어두운 배경, 눈의 피로 감소' },
    { key: 'system', label: '시스템', desc: '기기 설정을 따라감' },
  ];

  return (
    <main className="bj-main" style={{ maxWidth: 600 }}>
      <Link href="/" className="bj-back-link">← 홈으로</Link>
      <h1 className="bj-page-title">설정</h1>
      <p className="bj-page-sub">화면 테마를 선택하세요. 선택 즉시 적용됩니다.</p>

      {saved && <div className="bj-alert bj-alert-success">테마가 적용되었습니다</div>}

      <div className="bj-admin-card">
        <h3 style={{ marginBottom: 14 }}>테마</h3>
        <div className="bj-theme-options">
          {OPTIONS.map(o => (
            <button
              key={o.key}
              className={`bj-theme-option ${theme === o.key ? 'active' : ''}`}
              onClick={() => choose(o.key)}
            >
              <span className={`bj-theme-swatch sw-${o.key}`} aria-hidden />
              <span className="bj-theme-option-text">
                <strong>{o.label}</strong>
                <small>{o.desc}</small>
              </span>
              <span className="bj-theme-check">
                {theme === o.key && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
