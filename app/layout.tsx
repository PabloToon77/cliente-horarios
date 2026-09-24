'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import './globals.css';

function NavigationBar() {
  const { perfil, logout, tienePermiso } = useAuth();
  const pathname = usePathname();

  // No mostrar la barra de navegación en la pantalla de login
  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Topbar Institucional Superior */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-medium">
            Plataforma de Gestión Académica | <strong className="text-orange-400">Quality UP</strong>
          </span>
          {perfil && (
            <div className="flex items-center space-x-3">
              <span>Usuario: <strong>{perfil.email}</strong></span>
              {perfil.rol && (
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] px-2 py-0.5 rounded font-semibold">
                  {perfil.rol}
                </span>
              )}
              <button
                onClick={logout}
                className="text-red-400 hover:text-red-300 underline font-semibold ml-2 cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Navegación Principal Quality UP */}
      <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding Quality UP */}
        <a href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center font-extrabold text-2xl tracking-tight text-[#0052B4]">
            Quality<span className="text-[#FF6B35]">UP</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 border-l border-slate-300 pl-2 hidden sm:inline-block">
            Soluciones<br />Educativas
          </span>
        </a>

        {/* Enlaces de Navegación */}
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-700">
          {/* Docentes: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a
              href="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === '/' ? 'bg-blue-50 text-[#0052B4] font-bold' : 'hover:bg-slate-100 hover:text-[#0052B4]'
              }`}
            >
              Docentes
            </a>
          )}

          {/* Cursos: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a
              href="/cursos"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === '/cursos' ? 'bg-blue-50 text-[#0052B4] font-bold' : 'hover:bg-slate-100 hover:text-[#0052B4]'
              }`}
            >
              Cursos / Paralelos
            </a>
          )}

          {/* Feriados: Admins, Líder Nac */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional']) && (
            <a
              href="/feriados"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === '/feriados' ? 'bg-blue-50 text-[#0052B4] font-bold' : 'hover:bg-slate-100 hover:text-[#0052B4]'
              }`}
            >
              Calendario / Feriados
            </a>
          )}

          {/* Asignación Automática: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a
              href="/asignacion"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === '/asignacion' ? 'bg-blue-50 text-[#0052B4] font-bold' : 'hover:bg-slate-100 hover:text-[#0052B4]'
              }`}
            >
              Asignación
            </a>
          )}

          {/* Actividades Extras */}
          <a
            href="/actividades-extras"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === '/actividades-extras' ? 'bg-blue-50 text-[#0052B4] font-bold' : 'hover:bg-slate-100 hover:text-[#0052B4]'
            }`}
          >
            Actividades Extras
          </a>

          {/* Horario Consolidado */}
          <a
            href="/horario-consolidado"
            className="bg-[#0052B4] hover:bg-[#004098] text-white px-3.5 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            📊 Horarios
          </a>

          {/* Panel de Roles: Solo Administrador de Página */}
          {tienePermiso(['Administrador de página']) && (
            <a
              href="/admin/roles"
              className="bg-[#FF6B35] hover:bg-[#e05520] text-white px-3 py-2 rounded-lg font-bold shadow-sm transition-colors"
            >
              ⚙️ Roles
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-800 font-sans">
        <AuthProvider>
          <NavigationBar />
          <div>{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}