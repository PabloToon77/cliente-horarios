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
  title: 'Sistema Integrado de Horarios y Gestión Académica',
  description: 'Plataforma completa para docentes, cursos, calendarios, asignación, actividades extras e impresión de horarios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen text-slate-900`}>
        {/* Navigation Bar */}
        <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bold text-lg tracking-wide text-blue-400">
              Sistema Académico Integrado
            </span>
            <div className="flex flex-wrap justify-center space-x-6 text-sm font-medium">
              <a href="/" className="hover:text-blue-400 transition-colors">
                Docentes
              </a>
              <a href="/cursos" className="hover:text-blue-400 transition-colors">
                Cursos y Mallas
              </a>
              <a href="/feriados" className="hover:text-blue-400 transition-colors">
                Calendario / Feriados
              </a>
              <a href="/asignacion" className="hover:text-blue-400 transition-colors">
                Asignación Automática
              </a>
              <a href="/actividades-extras" className="hover:text-blue-400 transition-colors">
                Actividades Extras
              </a>
              <a href="/horario-consolidado" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-colors">
                📊 Horario Consolidado
              </a>
            </div>
          </div>
        </nav>

        {/* Dynamic Content */}
        <div className="py-6">{children}</div>
      </body>
    </html>
  );
}