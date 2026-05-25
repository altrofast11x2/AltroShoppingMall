'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser } from '@/lib/shop';

type SessionUser = { id: string; name: string; email: string; isAdmin: boolean; coins: number };

export default function NavBar() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const refresh = async () => {
      const raw = localStorage.getItem('altroshop_user');
      if (!raw) { setUser(null); return; }
      try {
        const s = JSON.parse(raw);
        // 최신 코인 잔액 동기화
        const fresh = await getUser(s.id);
        if (fresh) {
          const merged = { ...s, coins: fresh.coins };
          setUser(merged);
          localStorage.setItem('altroshop_user', JSON.stringify(merged));
        } else {
          setUser(s);
        }
      } catch { setUser(null); }
    };
    refresh();
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('altroshop:refresh', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('altroshop:refresh', onStorage);
    };
  }, [pathname]);

  const logout = () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    localStorage.removeItem('altroshop_user');
    setUser(null);
    router.push('/');
  };

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="nav-logo">Altro<span>Shop</span></Link>
        <Link href="/" className="nav-link">홈</Link>
        <Link href="/upload" className="nav-link">상품 등록</Link>
        <Link href="/cart" className="nav-link">장바구니</Link>
        {user?.isAdmin && <Link href="/admin" className="nav-link">관리자</Link>}

        {user ? (
          <>
            <span className="nav-coin" title="보유 코인">
              ◈ {Number(user.coins || 0).toLocaleString()}
            </span>
            <span className={`nav-user${user.isAdmin ? ' admin' : ''}`}>
              {user.isAdmin ? '👑 ' : ''}{user.name}
            </span>
            <button className="nav-btn" onClick={logout}>로그아웃</button>
          </>
        ) : (
          <Link href="/login" className="nav-btn accent">로그인</Link>
        )}
      </nav>
      {user?.isAdmin && (
        <div className="admin-banner">
          <span className="admin-dot" />
          관리자 모드 — 사용자별 코인 충전 가능
        </div>
      )}
    </>
  );
}
