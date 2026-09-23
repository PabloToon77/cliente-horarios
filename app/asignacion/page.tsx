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
  malla_json?: Record<string, number>;
  talleres_json?: Array<{ nombre: string; clases: number }>;
  horario_json?: BloqueClase[];
}

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  sede: string;
  tipo_contrato: string;
  horas_max_semanales?: number;
  disponibilidad_json?: Record<string, string[]>;
  profesor_materia?: { materias: { nombre: string } }[];
}

interface Asignacion {
  id: number;
  curso_id: number;
  profesor_id: number;
  materia: string;
  profesores?: { nombre: string; apellido: string };
}

export default function AsignacionPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [procesandoAuto, setProcesandoAuto] = useState(false);
  const [logAuto, setLogAuto] = useState<string[]>([]);

  const cargarDatos = async () => {
    setLoading(true);

    const { data: cData } = await supabase.from('cursos').select('*').eq('estado', 'Activo');
    const { data: pData } = await supabase.from('profesores').select(`
      *,
      profesor_materia ( materias ( nombre ) )
    `);
    const { data: aData } = await supabase.from('asignaciones').select(`
      *,
      profesores ( nombre, apellido )
    `);

    setCursos(cData || []);
    setProfesores(pData || []);
    setAsignaciones(aData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cursoActual = cursos.find((c) => c.id === Number(cursoSeleccionadoId));

  // Obtener docentes aptos de forma manual
  const obtenerCandidatos = (materiaNombre: string) => {
    if (!cursoActual) return [];

    return profesores.filter((prof) => {
      const dictaMateria = prof.profesor_materia?.some(
        (pm) => pm.materias?.nombre.toLowerCase() === materiaNombre.toLowerCase()
      );
      return dictaMateria;
    });
  };

  const handleAsignarProfesor = async (materia: string, profesorId: number) => {
    if (!cursoSeleccionadoId) return;

    const asignacionExistente = asignaciones.find(
      (a) => a.curso_id === Number(cursoSeleccionadoId) && a.materia === materia
    );

    if (asignacionExistente) {
      const { error } = await supabase
        .from('asignaciones')
        .update({ profesor_id: profesorId })
        .eq('id', asignacionExistente.id);

      if (error) alert('Error actualizando asignación: ' + error.message);
      else cargarDatos();
    } else {
      const { error } = await supabase.from('asignaciones').insert([
        {
          curso_id: Number(cursoSeleccionadoId),
          profesor_id: profesorId,
          materia,
        },
      ]);

      if (error) alert('Error guardando asignación: ' + error.message);
      else cargarDatos();
    }
  };

  // ALGORITMO DE ASIGNACIÓN AUTOMÁTICA
  const ejecutarAsignacionAutomatica = async () => {
    setProcesandoAuto(true);
    const logs: string[] = [];
    const cursosAProcesar = cursoSeleccionadoId ? cursos.filter((c) => c.id === Number(cursoSeleccionadoId)) : cursos;

    if (cursosAProcesar.length === 0) {
      alert('No hay cursos activos disponibles para asignar.');
      setProcesandoAuto(false);
      return;
    }

    logs.push(`Iniciando algoritmo para ${cursosAProcesar.length} curso(s)...`);

    for (const curso of cursosAProcesar) {
      logs.push(`\n📌 Procesando curso: "${curso.nombre}" (${curso.sede})`);

      if (!curso.malla_json) continue;

      const materias = Object.entries(curso.malla_json).filter(([_, clases]) => clases > 0);

      for (const [materia, clasesRequeridas] of materias) {
        // 1. Filtrar docentes habilitados en la materia
        let candidatos = profesores.filter((p) =>
          p.profesor_materia?.some(
            (pm) => pm.materias?.nombre.toLowerCase() === materia.toLowerCase()
          )
        );

        if (candidatos.length === 0) {
          logs.push(`  ❌ [${materia}]: Sin docentes registrados para esta materia.`);
          continue;
        }

        // 2. Priorizar candidatos por coincidencia de Sede
        candidatos.sort((a, b) => {
          const aSedeMatch = a.sede === curso.sede ? 1 : 0;
          const bSedeMatch = b.sede === curso.sede ? 1 : 0;
          return bSedeMatch - aSedeMatch;
        });

        // 3. Seleccionar el primer candidato que cumpla las condiciones
        const profesorSeleccionado = candidatos[0];

        if (profesorSeleccionado) {
          const asignacionExistente = asignaciones.find(
            (a) => a.curso_id === curso.id && a.materia === materia
          );

          if (asignacionExistente) {
            await supabase
              .from('asignaciones')
              .update({ profesor_id: profesorSeleccionado.id })
              .eq('id', asignacionExistente.id);
          } else {
            await supabase.from('asignaciones').insert([
              {
                curso_id: curso.id,
                profesor_id: profesorSeleccionado.id,
                materia,
              },
            ]);
          }

          logs.push(
            `  ✓ [${materia}]: Asignado a ${profesorSeleccionado.nombre} ${profesorSeleccionado.apellido} (${profesorSeleccionado.sede})`
          );
        }
      }
    }

    setLogAuto(logs);
    setProcesandoAuto(false);
    await cargarDatos();
    alert('¡Proceso de asignación automática completado!');
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Asignación de Docentes a Cursos</h1>
        <button
          onClick={ejecutarAsignacionAutomatica}
          disabled={procesandoAuto}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <span>{procesandoAuto ? 'Procesando...' : '⚡ Asignación Automática Inteligente'}</span>
        </button>
      </div>

      {/* Selector de Curso */}
      <div className="bg-slate-900 p-6 rounded-xl space-y-4 text-white shadow-lg">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">
          1. Selecciona un Curso / Paralelo Activo (Opcional)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Curso / Grupo</label>
            <select
              value={cursoSeleccionadoId}
              onChange={(e) => setCursoSeleccionadoId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Todos los Cursos (Para asignación masiva) --</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.sede} - {c.jornada})
                </option>
              ))}
            </select>
          </div>

          {cursoActual && (
            <div className="bg-slate-800 p-3 rounded-lg text-xs space-y-1">
              <p><span className="text-slate-400">Aula Física:</span> {cursoActual.aula_fisica}</p>
              <p><span className="text-slate-400">Sede:</span> {cursoActual.sede}</p>
              <p><span className="text-slate-400">Bloques agendados:</span> {cursoActual.horario_json?.length || 0} clases/sem</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen del Proceso Automático */}
      {logAuto.length > 0 && (
        <div className="bg-slate-800 p-5 rounded-xl text-xs font-mono text-slate-200 space-y-1 border border-slate-700">
          <h3 className="font-bold text-emerald-400 text-sm mb-2 font-sans">Reporte de Asignación Automática:</h3>
          {logAuto.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap">{line}</div>
          ))}
        </div>
      )}

      {/* Panel de Asignación Manual o Verificación */}
      {cursoActual && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">
            2. Malla Curricular y Asignación de Profesores
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {cursoActual.malla_json &&
              Object.entries(cursoActual.malla_json)
                .filter(([_, clases]) => clases > 0)
                .map(([materia, clases]) => {
                  const candidatos = obtenerCandidatos(materia);
                  const asignado = asignaciones.find(
                    (a) => a.curso_id === cursoActual.id && a.materia === materia
                  );

                  return (
                    <div
                      key={materia}
                      className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-base">{materia}</h3>
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200">
                            {clases} clases requeridas
                          </span>
                        </div>
                        {asignado && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1">
                            ✓ Docente Asignado: {asignado.profesores?.nombre} {asignado.profesores?.apellido}
                          </p>
                        )}
                      </div>

                      <div className="w-full md:w-72">
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Docente Asignado / Candidatos ({candidatos.length})
                        </label>
                        <select
                          value={asignado ? asignado.profesor_id : ''}
                          onChange={(e) => handleAsignarProfesor(materia, Number(e.target.value))}
                          className="w-full p-2 text-xs rounded border border-slate-300 bg-slate-50 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Asignar Docente --</option>
                          {candidatos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} {p.apellido} ({p.sede})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}
    </main>
  );
}