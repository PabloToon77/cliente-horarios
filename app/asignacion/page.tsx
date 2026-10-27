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

interface BloqueHorario {
  id: string;
  dia: string;
  horaInicio: string;
  minutoInicio: string;
  horaFin: string;
  minutoFin: string;
}

interface Curso {
  id: number;
  codigo: string;
  sede: string;
  periodo_lectivo: string;
  etapa?: string;
  horario_json?: BloqueHorario[];
  malla_json?: Record<string, number>;
}

interface AsignacionDB {
  id?: number;
  curso_id: number;
  profesor_id: number | null;
  materia: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  motivo_fallo?: string;
}

// Equivalencia entre nombres de malla en cursos y nombres de materias en docentes
const MAPEO_MATERIAS: Record<string, string[]> = {
  'Matemáticas': ['Matemáticas', 'Razonamiento Numérico'],
  'Física': ['Física'],
  'Química': ['Química'],
  'Biología': ['Biología'],
  'Lengua y Literatura': ['Lengua', 'Lengua y Literatura', 'Razonamiento Verbal'],
  'Historia / Ciencias Sociales': ['Ciencias Sociales', 'Historia / Ciencias Sociales'],
  'Abstracto / Razonamiento': ['Razonamiento Lógico', 'Abstracto / Razonamiento'],
  'Lógico': ['Razonamiento Lógico', 'Lógico'],
  'Verbal': ['Razonamiento Verbal', 'Verbal'],
  'OV': ['OV'],
};

export default function AsignacionPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | 'todos'>('todos');

  const cargarDatos = async () => {
    setLoading(true);

    const [
      { data: pData, error: pError },
      { data: cData, error: cError },
      { data: aData, error: aError }
    ] = await Promise.all([
      supabase.from('profesores').select(`*, profesor_materia ( materias ( nombre ) )`),
      supabase.from('cursos').select('*').order('created_at', { ascending: false }),
      supabase.from('asignaciones').select('*')
    ]);

    if (pError) console.error('Error cargando profesores:', pError);
    if (cError) console.error('Error cargando cursos:', cError);
    if (aError) console.error('Error cargando asignaciones:', aError);

    setProfesores(pData || []);
    setCursos(cData || []);
    setAsignaciones(aData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // MOTOR PRINCIPAL DE ASIGNACIÓN AUTOMÁTICA
  const inicializarAsignacionAutomatica = async (cursoEspecificoId?: number) => {
    const cursosAProcesar = cursoEspecificoId
      ? cursos.filter((c) => c.id === cursoEspecificoId)
      : cursos;

    if (cursosAProcesar.length === 0) {
      alert('No hay cursos disponibles para procesar.');
      return;
    }

    setProcesando(true);

    try {
      // 1. Limpiar asignaciones previas de los cursos que vamos a recalcular
      const idsCursos = cursosAProcesar.map((c) => c.id);
      await supabase.from('asignaciones').delete().in('curso_id', idsCursos);

      // Obtener asignaciones de otros cursos que no se están recalculando para respetar choques de horario
      const asignacionesActivas: AsignacionDB[] = asignaciones.filter(
        (a) => !idsCursos.includes(a.curso_id)
      );

      // Contador de carga horaria actual por profesor (para balancear equitativamente)
      const cargaProfesor: Record<number, number> = {};
      profesores.forEach((p) => (cargaProfesor[p.id] = 0));
      asignacionesActivas.forEach((a) => {
        if (a.profesor_id) {
          cargaProfesor[a.profesor_id] = (cargaProfesor[a.profesor_id] || 0) + 1;
        }
      });

      const nuevasAsignaciones: AsignacionDB[] = [];

      // 2. Recorrer cada curso a asignar
      for (const curso of cursosAProcesar) {
        const malla = curso.malla_json || {};
        const bloques = curso.horario_json || [];

        // Desglosar cuántas clases individuales necesita el curso según su malla
        const colaMaterias: string[] = [];
        Object.entries(malla).forEach(([materia, cantidadClases]) => {
          for (let i = 0; i < Number(cantidadClases); i++) {
            colaMaterias.push(materia);
          }
        });

        // 3. Asignar cada bloque horario del curso a una materia pendiente
        for (let i = 0; i < bloques.length; i++) {
          const bloque = bloques[i];
          const materiaMalla = colaMaterias[i] || 'Taller / Libre';
          const hInicio = `${bloque.horaInicio}:${bloque.minutoInicio}`;
          const hFin = `${bloque.horaFin}:${bloque.minutoFin}`;
          const etiquetaBloque = `${hInicio} - ${hFin}`;

          if (materiaMalla === 'Taller / Libre') continue;

          const nombresMateriaCompatibles = MAPEO_MATERIAS[materiaMalla] || [materiaMalla];

          // Filtrar docentes candidatos
          const candidatos = profesores.filter((prof) => {
            // A. ¿Imparte la materia?
            const materiasDocente = prof.profesor_materia?.map((pm) => pm.materias?.nombre) || [];
            const dictaMateria = materiasDocente.some((m) => nombresMateriaCompatibles.includes(m));
            if (!dictaMateria) return false;

            // B. ¿Trabaja en la sede del curso?
            const sedesDocente = prof.sede ? prof.sede.split(',').map((s) => s.trim()) : [];
            if (!sedesDocente.includes(curso.sede)) return false;

            // C. ¿Tiene disponibilidad marcada en ese día y bloque?
            const dispDia = prof.disponibilidad_json?.[bloque.dia] || [];
            const coincideHorario = dispDia.some(
              (rango) => rango.startsWith(hInicio) || rango === etiquetaBloque
            );
            if (!coincideHorario) return false;

            // D. ¿No tiene choque de horario con otro curso a la misma hora?
            const tieneChoque = [...asignacionesActivas, ...nuevasAsignaciones].some(
              (asig) =>
                asig.profesor_id === prof.id &&
                asig.dia === bloque.dia &&
                asig.hora_inicio === hInicio
            );
            if (tieneChoque) return false;

            // E. ¿Aún no supera sus horas máximas semanales?
            const maxHoras = prof.horas_max_semanales || 40;
            if ((cargaProfesor[prof.id] || 0) >= maxHoras) return false;

            return true;
          });

          // Ordenar candidatos por menor carga horaria para distribuir equitativamente
          candidatos.sort((a, b) => (cargaProfesor[a.id] || 0) - (cargaProfesor[b.id] || 0));

          if (candidatos.length > 0) {
            const elegido = candidatos[0];
            cargaProfesor[elegido.id] = (cargaProfesor[elegido.id] || 0) + 1;

            nuevasAsignaciones.push({
              curso_id: curso.id,
              profesor_id: elegido.id,
              materia: materiaMalla,
              dia: bloque.dia,
              hora_inicio: hInicio,
              hora_fin: hFin,
              estado: 'Asignado',
            });
          } else {
            nuevasAsignaciones.push({
              curso_id: curso.id,
              profesor_id: null,
              materia: materiaMalla,
              dia: bloque.dia,
              hora_inicio: hInicio,
              hora_fin: hFin,
              estado: 'Sin Docente',
              motivo_fallo: `Sin docente de ${materiaMalla} en ${curso.sede} disponible el ${bloque.dia} (${hInicio}-${hFin}).`,
            });
          }
        }
      }

      // 4. Guardar resultados en Supabase
      if (nuevasAsignaciones.length > 0) {
        const { error: insertError } = await supabase.from('asignaciones').insert(nuevasAsignaciones);
        if (insertError) throw insertError;
        alert(`✅ Asignación completada: Se procesaron ${nuevasAsignaciones.length} bloques de clases.`);
      } else {
        alert('⚠️ Los cursos seleccionados no tienen malla curricular o bloques horarios configurados.');
      }

      await cargarDatos();
    } catch (err: any) {
      alert('Error durante la asignación automática: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const obtenerProfesor = (id: number | null) => profesores.find((p) => p.id === id);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Cabecera y Botón Maestro de Inicialización */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Motor de Asignación Automática</h1>
          <p className="text-xs text-slate-300 mt-1">
            Cruza la malla curricular y bloques de cada curso con la sede, especialidad y disponibilidad de tus docentes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inicializarAsignacionAutomatica()}
          disabled={procesando || loading}
          className="bg-[#FF6B35] hover:bg-[#e05520] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          {procesando ? '⚙️ Procesando Horarios...' : '⚡ Inicializar Asignación Global'}
        </button>
      </div>

      {/* Tabla de Cursos y Estado de Asignación */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Cursos y Bloques Asignados</h2>
          <select
            value={cursoSeleccionado}
            onChange={(e) =>
              setCursoSeleccionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
            }
            className="p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="todos">Ver todos los cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} ({c.sede})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando datos del motor...</p>
        ) : cursos.length === 0 ? (
          <p className="text-slate-500 italic">No hay cursos creados todavía.</p>
        ) : (
          <div className="space-y-6">
            {cursos
              .filter((c) => cursoSeleccionado === 'todos' || c.id === cursoSeleccionado)
              .map((curso) => {
                const asigCurso = asignaciones.filter((a) => a.curso_id === curso.id);
                const asignadosCount = asigCurso.filter((a) => a.profesor_id !== null).length;

                return (
                  <div key={curso.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Barra de Título del Curso */}
                    <div className="bg-slate-100 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <span className="bg-[#0052B4] text-white font-mono font-extrabold text-sm px-3 py-1 rounded">
                          {curso.codigo}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Sede: <strong>{curso.sede}</strong> | Etapa: <strong>{curso.etapa || 'Base'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-700">
                          {asignadosCount} / {asigCurso.length} Bloques Cubiertos
                        </span>
                        <button
                          type="button"
                          onClick={() => inicializarAsignacionAutomatica(curso.id)}
                          disabled={procesando}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          🔄 Asignar solo este curso
                        </button>
                      </div>
                    </div>

                    {/* Desglose de Bloques del Curso */}
                    {asigCurso.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 italic">
                        Sin asignaciones generadas. Haz clic en &quot;Asignar solo este curso&quot; o &quot;Inicializar Asignación Global&quot;.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b">
                          <tr>
                            <th className="p-3">Día y Horario</th>
                            <th className="p-3">Materia Requerida</th>
                            <th className="p-3">Docente Asignado</th>
                            <th className="p-3">Estado / Observación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {asigCurso.map((asig, idx) => {
                            const prof = obtenerProfesor(asig.profesor_id);
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-700">
                                  {asig.dia} ({asig.hora_inicio} - {asig.hora_fin})
                                </td>
                                <td className="p-3 font-semibold text-slate-800">{asig.materia}</td>
                                <td className="p-3">
                                  {prof ? (
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className="w-3 h-3 rounded-full inline-block"
                                        style={{ backgroundColor: prof.color_hex || '#0052B4' }}
                                      />
                                      <span className="font-bold text-slate-800">
                                        {prof.nombre} {prof.apellido}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-rose-600 font-semibold italic">No asignado</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {prof ? (
                                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                                      ✅ Asignado
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 text-[11px]">{asig.motivo_fallo}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </main>
  );
}