import './globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'AltroShop',
  description: 'AltroShop — 사고, 팔고, 둘러보고',
};

// 페인트 전에 테마를 적용해 깜빡임(FOUC) 방지
const themeInit = `(function(){try{var t=localStorage.getItem('altroshop_theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body suppressHydrationWarning>
        <NavBar />
        {children}
        <footer className="bj-footer">
          AltroShop — 사고, 팔고, 둘러보고<br />
          AltroBoard 통합 계정으로 자유롭게 거래하세요
        </footer>
      </body>
    </html>
  );
}
