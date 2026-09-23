'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BloqueClase {
  id: string;
  dia: string;
  horaInicio: string;
  minutoInicio: string;
  horaFin: string;
  minutoFin: string;
}

interface Curso {
  id: number;
  nombre: string;
  sede: string;
  jornada: string;
  aula_fisica: string;
  horario_json?: BloqueClase[];
}

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
}

interface Asignacion {
  id: number;
  curso_id: number;
  profesor_id: number;
  materia: string;
  profesores?: { nombre: string; apellido: string };
  cursos?: { nombre: string; aula_fisica: string; sede: string };
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function HorarioConsolidadoPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'curso' | 'profesor' | 'aula'>('curso');
  const [seleccionId, setSeleccionId] = useState<string>('');

  const cargarDatos = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('cursos').select('*').eq('estado', 'Activo');
    const { data: pData } = await supabase.from('profesores').select('id, nombre, apellido');
    const { data: aData } = await supabase.from('asignaciones').select(`
      *,
      profesores ( nombre, apellido ),
      cursos ( nombre, aula_fisica, sede )
    `);

    setCursos(cData || []);
    setProfesores(pData || []);
    setAsignaciones(aData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Agrupar clases programadas según el filtro activo
  const obtenerClasesFiltradas = () => {
    const clasesTotales: Array<{
      dia: string;
      hora: string;
      materia: string;
      profesor: string;
      curso: string;
      aula: string;
    }> = [];

    cursos.forEach((curso) => {
      if (filtroTipo === 'curso' && seleccionId && curso.id !== Number(seleccionId)) return;
      if (filtroTipo === 'aula' && seleccionId && curso.aula_fisica !== seleccionId) return;

      const asignacionesCurso = asignaciones.filter((a) => a.curso_id === curso.id);

      curso.horario_json?.forEach((b) => {
        asignacionesCurso.forEach((asig) => {
          if (filtroTipo === 'profesor' && seleccionId && asig.profesor_id !== Number(seleccionId)) return;

          clasesTotales.push({
            dia: b.dia,
            hora: `${b.horaInicio}:${b.minutoInicio} - ${b.horaFin}:${b.minutoFin}`,
            materia: asig.materia,
            profesor: `${asig.profesores?.nombre || ''} ${asig.profesores?.apellido || ''}`,
            curso: curso.nombre,
            aula: curso.aula_fisica,
          });
        });
      });
    });

    return clasesTotales;
  };

  const clasesFiltradas = obtenerClasesFiltradas();

  // Lista única de aulas físicas para el selector
  const aulasDisponibles = Array.from(new Set(cursos.map((c) => c.aula_fisica).filter(Boolean)));

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Horario Consolidado e Integración</h1>
          <p className="text-sm text-slate-500">Visualiza y exporta la agenda semanal integrada por Curso, Docente o Aula Física.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow transition-colors print:hidden"
        >
          🖨️ Imprimir / Exportar a PDF
        </button>
      </div>

      {/* Controles de Filtrado */}
      <div className="bg-slate-900 text-white p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 shadow-md print:hidden">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Ver Horario por:</label>
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value as any);
              setSeleccionId('');
            }}
            className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="curso">Por Curso / Paralelo</option>
            <option value="profesor">Por Docente</option>
            <option value="aula">Por Aula Física</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">
            {filtroTipo === 'curso' && 'Seleccionar Curso:'}
            {filtroTipo === 'profesor' && 'Seleccionar Docente:'}
            {filtroTipo === 'aula' && 'Seleccionar Aula Física:'}
          </label>
          <select
            value={seleccionId}
            onChange={(e) => setSeleccionId(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Mostrar Todos / General --</option>
            {filtroTipo === 'curso' &&
              cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.sede})
                </option>
              ))}
            {filtroTipo === 'profesor' &&
              profesores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido}
                </option>
              ))}
            {filtroTipo === 'aula' &&
              aulasDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grilla Consolidada */}
      {loading ? (
        <p className="text-slate-500">Cargando horario consolidado...</p>
      ) : clasesFiltradas.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-slate-500 italic">No hay sesiones o asignaciones registradas para el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {DIAS_SEMANA.map((dia) => {
            const clasesDia = clasesFiltradas.filter((c) => c.dia === dia);

            return (
              <div key={dia} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="bg-slate-100 p-2.5 text-center font-bold text-slate-800 text-sm border-b border-slate-200">
                  {dia}
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {clasesDia.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-4">- Sin clases -</p>
                  ) : (
                    clasesDia.map((c, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs space-y-1">
                        <span className="font-mono text-[10px] font-semibold text-blue-800 block">
                          ⏱️ {c.hora}
                        </span>
                        <p className="font-bold text-slate-900">{c.materia}</p>
                        <p className="text-slate-600 font-medium">👤 {c.profesor}</p>
                        <p className="text-slate-500 text-[10px]">🏫 {c.curso} ({c.aula})</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}