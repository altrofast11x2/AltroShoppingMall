import './globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'AltroShop',
  description: 'AltroShop — 사고, 팔고, 둘러보고',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
