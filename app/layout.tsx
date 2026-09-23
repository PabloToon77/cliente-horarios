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
  title: 'Sistema de Horarios y Gestión Académica',
  description: 'Sistema de gestión de docentes, cursos, paralelos, calendarios académicos y asignación de horarios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen text-slate-900`}>
        {/* Barra de Navegación Global */}
        <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bold text-lg tracking-wide text-blue-400">
              Sistema Académico
            </span>
            <div className="flex flex-wrap justify-center space-x-6 text-sm font-medium">
              <a href="/" className="hover:text-blue-400 transition-colors">
                Gestión de Docentes
              </a>
              <a href="/cursos" className="hover:text-blue-400 transition-colors">
                Gestión de Cursos
              </a>
              <a href="/feriados" className="hover:text-blue-400 transition-colors">
                Feriados y Calendario
              </a>
              <a href="/asignacion" className="hover:text-blue-400 transition-colors">
                Asignación de Horarios
              </a>
            </div>
          </div>
        </nav>

        {/* Contenido dinámico de cada página */}
        <div className="py-6">{children}</div>
      </body>
    </html>
  );
}