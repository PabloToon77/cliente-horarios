'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface PerfilUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

const ROLES = [
  'Administrador de página',
  'Lider Académico Nacional',
  'Lider Académico',
  'Profesor',
];

export default function GestionRolesPage() {
  const { tienePermiso } = useAuth();
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase.from('perfiles').select('*').order('email');
    setUsuarios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCambiarRol = async (id: string, nuevoRol: string) => {
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id);
    if (error) alert('Error actualizando rol: ' + error.message);
    else {
      alert('Rol actualizado con éxito.');
      cargarUsuarios();
    }
  };

  if (!tienePermiso(['Administrador de página'])) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-600 font-bold">
        🚫 Acceso denegado. Solo el Administrador de Página puede gestionar roles.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Administración de Roles de Usuarios</h1>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 text-sm">
            <tr>
              <th className="p-3.5 border-b">Usuario / Email</th>
              <th className="p-3.5 border-b">Nombre</th>
              <th className="p-3.5 border-b">Rol Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-medium text-slate-900">{u.email}</td>
                <td className="p-3.5 text-slate-700">{u.nombre || 'Sin nombre'}</td>
                <td className="p-3.5">
                  <select
                    value={u.rol}
                    onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}