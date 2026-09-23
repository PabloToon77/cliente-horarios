import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sistema de Horarios y Nómina',
  description: 'Gestión Académica y Horarios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen`}>
        {/* Barra de Navegación Global */}
        <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="font-bold text-lg tracking-wide text-blue-400">
              Sistema Académico
            </span>
            <div className="flex space-x-6 text-sm font-medium">
              <a href="/" className="hover:text-blue-400 transition-colors">
                Gestión de Docentes
              </a>
              <a href="/cursos" className="hover:text-blue-400 transition-colors">
                Gestión de Cursos
              </a>
            </div>
          </div>
        </nav>

        {/* Contenido de cada página */}
        <div className="py-6">{children}</div>
      </body>
    </html>
  );
}