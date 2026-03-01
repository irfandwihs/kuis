import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'StudyLab - Platform Game Edukasi Interaktif',
  description: 'StudyLab adalah platform game edukasi interaktif yang dirancang untuk membuat pembelajaran menyenangkan dan menarik.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
