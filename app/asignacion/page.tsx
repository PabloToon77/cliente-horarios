'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  sede: string;
  color_hex?: string;
  horas_max_semanales?: number;
  disponibilidad_json?: Record<string, string[]>;
  profesor_materia?: { materias: { nombre: string } }[];
}

interface Curso {
  id: number;
  codigo: string;
  sede: string;
  periodo_lectivo: string;
  etapa?: string;
  horario_json?: { dia: string; horaInicio: string; minutoInicio: string; horaFin: string; minutoFin: string }[];
  malla_json?: Record<string, number>;
}

export default function AsignacionPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    setLoading(true);

    const { data: pData, error: pError } = await supabase.from('profesores').select(`
      *,
      profesor_materia (
        materias ( nombre )
      )
    `);

    const { data: cData, error: cError } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });

    if (pError) console.error('Error cargando profesores:', pError);
    if (cError) console.error('Error cargando cursos:', cError);

    setProfesores(pData || []);
    setCursos(cData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Módulo de Asignación Docente</h1>

      {/* Resumen de Datos Registrados */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
          Estatus del Sistema Académico
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-3xl font-extrabold text-[#0052B4]">
              {loading ? '...' : profesores.length}
            </div>
            <div className="text-sm font-semibold text-slate-700">Docentes Registrados</div>
            <p className="text-xs text-slate-500">
              Profesorado disponible con materias, disponibilidad horaria y sedes asociadas.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-3xl font-extrabold text-[#FF6B35]">
              {loading ? '...' : cursos.length}
            </div>
            <div className="text-sm font-semibold text-slate-700">Cursos y Paralelos Creados</div>
            <p className="text-xs text-slate-500">
              Cursos con código único, etapa, malla curricular y horarios configurados.
            </p>
          </div>
        </div>
      </section>

      {/* Listado de Cursos Disponibles para Asignar */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Cursos Pendientes de Asignación</h2>

        {loading ? (
          <p className="text-slate-500">Cargando datos del sistema...</p>
        ) : cursos.length === 0 ? (
          <p className="text-slate-500 italic">No hay cursos registrados actualmente.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Código del Curso</th>
                  <th className="p-3.5 border-b">Etapa</th>
                  <th className="p-3.5 border-b">Sede</th>
                  <th className="p-3.5 border-b">Período / Ciclo</th>
                  <th className="p-3.5 border-b text-center">Estado de Asignación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cursos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="bg-blue-50 text-[#0052B4] border border-blue-200 font-mono font-extrabold text-xs px-2.5 py-1 rounded-md">
                        {c.codigo}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-2 py-0.5 rounded">
                        {c.etapa || 'Base'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{c.sede}</td>
                    <td className="p-3.5 text-slate-600">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        c.periodo_lectivo === 'Ciclo Sierra' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.periodo_lectivo}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded border border-slate-200">
                        Pendiente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}