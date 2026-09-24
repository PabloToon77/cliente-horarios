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
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg tracking-wide text-blue-400">
            Sistema Académico
          </span>
          {perfil?.rol && (
            <span className="bg-slate-800 text-blue-300 border border-slate-700 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
              {perfil.rol}
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center items-center space-x-4 text-sm font-medium">
          {/* Docentes: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a href="/" className="hover:text-blue-400 transition-colors">Docentes</a>
          )}

          {/* Cursos: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a href="/cursos" className="hover:text-blue-400 transition-colors">Cursos</a>
          )}

          {/* Feriados: Admins, Líder Nac */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional']) && (
            <a href="/feriados" className="hover:text-blue-400 transition-colors">Feriados</a>
          )}

          {/* Asignación Automática: Admins, Líder Nac, Líder Académico */}
          {tienePermiso(['Administrador de página', 'Lider Académico Nacional', 'Lider Académico']) && (
            <a href="/asignacion" className="hover:text-blue-400 transition-colors">Asignación</a>
          )}

          {/* Actividades Extras: Todos los roles */}
          <a href="/actividades-extras" className="hover:text-blue-400 transition-colors">Actividades Extras</a>

          {/* Horario Consolidado: Todos los roles */}
          <a href="/horario-consolidado" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-colors">
            📊 Horarios
          </a>

          {/* Panel de Roles: Solo Administrador de Página */}
          {tienePermiso(['Administrador de página']) && (
            <a href="/admin/roles" className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
              ⚙️ Roles
            </a>
          )}

          {perfil && (
            <button onClick={logout} className="text-xs text-slate-400 hover:text-red-400 underline ml-2">
              Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-900">
        <AuthProvider>
          <NavigationBar />
          <div>{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}