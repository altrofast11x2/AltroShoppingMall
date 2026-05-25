import './globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'AltroShop',
  description: 'AltroShop — 커뮤니티형 쇼핑몰',
};

const THEME_BOOTSTRAP = `
(function(){try{
  var t = localStorage.getItem('altroshop_theme') || 'light';
  if (t === 'auto') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body suppressHydrationWarning>
        <div className="app-shell">
          <NavBar />
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
