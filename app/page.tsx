'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  horas_max_semanales: number;
  tarifa_hora_clase: number;
  tarifa_hora_admin: number;
}

export default function Home() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [horasMax, setHorasMax] = useState(40);

  // Cargar profesores desde Supabase
  const fetchProfesores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profesores').select('*');
    if (error) console.error('Error cargando profesores:', error);
    else setProfesores(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfesores();
  }, []);

  // Agregar un profesor a la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('profesores').insert([
      {
        nombre,
        apellido,
        email,
        horas_max_semanales: horasMax,
        tarifa_hora_clase: 15.00,
        tarifa_hora_admin: 10.00,
      },
    ]);

    if (error) {
      alert('Error guardando profesor: ' + error.message);
    } else {
      setNombre('');
      setApellido('');
      setEmail('');
      fetchProfesores();
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Gestión de Profesores</h1>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-lg space-y-4 text-white">
        <h2 className="text-xl font-semibold">Agregar Nuevo Profesor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
          />
          <input
            type="text"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
          />
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
          />
          <input
            type="number"
            placeholder="Carga horaria máxima (semanal)"
            value={horasMax}
            onChange={(e) => setHorasMax(Number(e.target.value))}
            required
            className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
          />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium">
          Guardar Profesor
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Lista de Docentes</h2>
        {loading ? (
          <p>Cargando lista...</p>
        ) : profesores.length === 0 ? (
          <p className="text-gray-500">No hay profesores registrados aún.</p>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 border-b">Nombre</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Máx. Horas</th>
                  <th className="p-3 border-b">Tarifa Clase</th>
                </tr>
              </thead>
              <tbody>
                {profesores.map((prof) => (
                  <tr key={prof.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">{prof.nombre} {prof.apellido}</td>
                    <td className="p-3">{prof.email}</td>
                    <td className="p-3">{prof.horas_max_semanales} hrs/sem</td>
                    <td className="p-3">${prof.tarifa_hora_clase}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}