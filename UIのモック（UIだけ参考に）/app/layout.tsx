import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import SideNav from '@/components/layout/side-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice AI Call System',
  description: 'Real-time voice AI call monitoring and management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex h-screen overflow-hidden">
            <SideNav />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <Toaster 
            position="bottom-right"
            expand={true}
            richColors={true}
            closeButton={true}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}