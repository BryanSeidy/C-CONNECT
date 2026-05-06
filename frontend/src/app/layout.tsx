import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Providers } from './providers';

export const metadata = {
  title: 'CEMAC Connect',
  description: 'Marketplace B2B régionale CEMAC'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
