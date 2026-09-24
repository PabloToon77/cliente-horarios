'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type Rol = 'Administrador de página' | 'Lider Académico Nacional' | 'Lider Académico' | 'Profesor' | null;

interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  profesor_id?: number;
}

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  logout: () => Promise<void>;
  tienePermiso: (rolesPermitidos: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  loading: true,
  logout: async () => {},
  tienePermiso: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const cargarPerfil = async (userId: string) => {
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    setPerfil(data || null);
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        await cargarPerfil(session.user.id);
        if (pathname === '/login') {
          router.push('/');
        }
      } else {
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        await cargarPerfil(session.user.id);
        if (pathname === '/login') {
          router.push('/');
        }
      } else {
        setPerfil(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setUser(null);
    router.push('/login');
  };

  const tienePermiso = (rolesPermitidos: Rol[]) => {
    if (!perfil || !perfil.rol) return false;
    return rolesPermitidos.includes(perfil.rol);
  };

  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Verificando sesión...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);