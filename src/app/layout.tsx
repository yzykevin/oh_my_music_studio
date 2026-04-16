import type { Metadata } from 'next';
import './globals.css';
import { ThemeInit } from './components/ThemeInit';
import { ThemeProvider } from './context/ThemeContext';

export const metadata: Metadata = {
  title: 'OMS',
  description: 'Analyze local music production tools and system information',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeInit />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
