'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Curso {
  id: number;
  nombre: string;
  sede: string;
  jornada: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Materia {
  id: number;
  nombre: string;
}

const SEDES = ['Ambato', 'Quito', 'Riobamba', 'Lago Agrio', 'Loja', 'Latacunga', 'Puyo'];
const JORNADAS = ['Matutina (08:00 - 12:00)', 'Vespertina (14:00 - 18:00)', 'Nocturna (18:00 - 21:00)', 'Intensivo Fin de Semana'];

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Curso
  const [nombre, setNombre] = useState('');
  const [sede, setSede] = useState('Ambato');
  const [jornada, setJornada] = useState(JORNADAS[0]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cargar Cursos y Materias
  const cargarDatos = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('cursos').select('*').order('id', { ascending: false });
    const { data: mData } = await supabase.from('materias').select('*');
    
    setCursos(cData || []);
    setMaterias(mData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmitCurso = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('cursos').insert([
      {
        nombre,
        sede,
        jornada,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
      },
    ]);

    if (error) {
      alert('Error creando el curso: ' + error.message);
    } else {
      setNombre('');
      setFechaInicio('');
      setFechaFin('');
      cargarDatos();
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Navegación básica */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">Gestión de Cursos y Paralelos</h1>
        <div className="space-x-4">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            ← Ir a Profesores
          </Link>
        </div>
      </div>

      {/* Formulario de Curso */}
      <form onSubmit={handleSubmitCurso} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Crear Nuevo Curso / Grupo</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Nombre del Curso / Grupo</label>
            <input
              type="text"
              placeholder="Ej. Preuniversitario Intensivo - Grupo A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Sede</label>
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              {SEDES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Jornada / Horario</label>
            <select
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              {JORNADAS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha de Finalización</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
        >
          Guardar Curso
        </button>
      </form>

      {/* Lista de Cursos Registrados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Cursos Activos</h2>
        {loading ? (
          <p className="text-slate-500">Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p className="text-slate-500 italic">No hay cursos registrados aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cursos.map((c) => (
              <div key={c.id} className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 text-lg">{c.nombre}</h3>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                    {c.sede}
                  </span>
                </div>
                <p className="text-xs text-slate-600">Jornada: <span className="font-medium">{c.jornada}</span></p>
                {c.fecha_inicio && c.fecha_fin && (
                  <p className="text-xs text-slate-500">
                    Período: {c.fecha_inicio} al {c.fecha_fin}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}