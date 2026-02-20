import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oh My Music Studio',
  description: 'Analyze local music production tools and system information',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
