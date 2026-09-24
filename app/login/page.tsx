'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Error de inicio de sesión: ' + error.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6 relative overflow-hidden">
      {/* Círculo Azul de Fondo Estilo Quality UP */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0052B4] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl opacity-20 pointer-events-none"></div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 border border-slate-200 relative z-10">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center font-extrabold text-3xl tracking-tight text-[#0052B4] mb-1">
            Quality<span className="text-[#FF6B35]">UP</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Soluciones Educativas</p>
          <h1 className="text-lg font-bold text-slate-800 pt-2">Plataforma de Gestión Académica</h1>
          <p className="text-xs text-slate-500">Ingresa con tus credenciales asignadas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="docente@qualityup.edu.ec"
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#0052B4] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#0052B4] focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0052B4] hover:bg-[#004098] text-white font-bold py-3 rounded-lg transition-colors text-sm shadow-md cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar a la Plataforma'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          © {new Date().getFullYear()} Quality UP - Todos los derechos reservados.
        </div>
      </div>
    </main>
  );
}