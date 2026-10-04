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
}

interface ResultadoSimulacion {
  idPrueba: number;
  cursoCodigo: string;
  sedeCurso: string;
  materiaEvaluada: string;
  diaEvaluado: string;
  bloqueEvaluado: string;
  profesorElegido: Profesor | null;
  motivoEleccion: string;
  descartados: { nombre: string; motivo: string }[];
}

const MATERIAS_DISPONIBLES = [
  'Matemáticas',
  'Química',
  'Física',
  'Biología',
  'Lengua',
  'Ciencias Sociales',
  'Razonamiento Numérico',
  'Razonamiento Verbal',
  'Razonamiento Lógico',
  'OV',
];

const SEDES_SIMULADAS = ['Ambato', 'Quito', 'Latacunga', 'Riobamba', 'Online'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const BLOQUES = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
];

// Cursos ficticios por defecto si no existen en la base de datos
const CURSOS_MOCK: Curso[] = [
  { id: 901, codigo: 'RS0-AMB-01-27', sede: 'Ambato', periodo_lectivo: 'Ciclo Sierra' },
  { id: 902, codigo: 'RS0-QUI-01-27', sede: 'Quito', periodo_lectivo: 'Ciclo Sierra' },
  { id: 903, codigo: 'RS0-LAT-01-27', sede: 'Latacunga', periodo_lectivo: 'Ciclo Sierra' },
  { id: 904, codigo: 'AMB-UTA-A', sede: 'Ambato', periodo_lectivo: 'Ciclo Costa' },
  { id: 905, codigo: 'ONL-EPN-A', sede: 'Online', periodo_lectivo: 'Ciclo Costa' },
];

export default function AsignacionPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para pruebas automáticas
  const [cantidadPruebas, setCantidadPruebas] = useState<number>(5);
  const [resultadosBatch, setResultadosBatch] = useState<ResultadoSimulacion[]>([]);
  const [ejecutandoBatch, setEjecutandoBatch] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);

    const { data: pData } = await supabase.from('profesores').select(`
      *,
      profesor_materia (
        materias ( nombre )
      )
    `);

    const { data: cData } = await supabase.from('cursos').select('*');

    setProfesores(pData || []);
    setCursos(cData && cData.length > 0 ? cData : CURSOS_MOCK);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función núcleo de evaluación del algoritmo
  const evaluarEscenario = (
    idPrueba: number,
    cursoObj: Curso,
    materia: string,
    dia: string,
    bloque: string
  ): ResultadoSimulacion => {
    const sedeCurso = cursoObj.sede || 'Ambato';
    const descartados: { nombre: string; motivo: string }[] = [];
    const candidatosAptos: Profesor[] = [];

    profesores.forEach((prof) => {
      const nombreCompleto = `${prof.nombre} ${prof.apellido}`;

      // 1. Materia
      const materiasProfesor = prof.profesor_materia?.map((pm) => pm.materias?.nombre) || [];
      if (!materiasProfesor.includes(materia)) {
        descartados.push({ nombre: nombreCompleto, motivo: `No dicta la materia "${materia}".` });
        return;
      }

      // 2. Sede
      const sedesProfesor = prof.sede ? prof.sede.split(', ') : [];
      if (!sedesProfesor.includes(sedeCurso)) {
        descartados.push({ nombre: nombreCompleto, motivo: `No habilitado para la sede "${sedeCurso}".` });
        return;
      }

      // 3. Disponibilidad Horaria
      const disponibilidadDia = prof.disponibilidad_json?.[dia] || [];
      if (!disponibilidadDia.includes(bloque)) {
        descartados.push({
          nombre: nombreCompleto,
          motivo: `Sin disponibilidad el ${dia} a las ${bloque}.`,
        });
        return;
      }

      candidatosAptos.push(prof);
    });

    if (candidatosAptos.length === 0) {
      return {
        idPrueba,
        cursoCodigo: cursoObj.codigo,
        sedeCurso,
        materiaEvaluada: materia,
        diaEvaluado: dia,
        bloqueEvaluado: bloque,
        profesorElegido: null,
        motivoEleccion: 'Ningún docente disponible con materia, sede y horario compatibles.',
        descartados,
      };
    }

    const elegido = candidatosAptos[0];
    return {
      idPrueba,
      cursoCodigo: cursoObj.codigo,
      sedeCurso,
      materiaEvaluada: materia,
      diaEvaluado: dia,
      bloqueEvaluado: bloque,
      profesorElegido: elegido,
      motivoEleccion: `Elegido exitosamente. Docente habilitado en ${sedeCurso} con la materia "${materia}".`,
      descartados,
    };
  };

  // Generador Automático de Entradas y Batería de Tests
  const generarYEjecutarPruebasAutomated = () => {
    setEjecutandoBatch(true);

    const cursosBase = cursos.length > 0 ? cursos : CURSOS_MOCK;
    const nuevosResultados: ResultadoSimulacion[] = [];

    for (let i = 1; i <= cantidadPruebas; i++) {
      const cursoRandom = cursosBase[Math.floor(Math.random() * cursosBase.length)];
      const materiaRandom = MATERIAS_DISPONIBLES[Math.floor(Math.random() * MATERIAS_DISPONIBLES.length)];
      const diaRandom = DIAS[Math.floor(Math.random() * DIAS.length)];
      const bloqueRandom = BLOQUES[Math.floor(Math.random() * BLOQUES.length)];

      const resultadoTest = evaluarEscenario(i, cursoRandom, materiaRandom, diaRandom, bloqueRandom);
      nuevosResultados.push(resultadoTest);
    }

    setResultadosBatch(nuevosResultados);
    setEjecutandoBatch(false);
  };

  // Métricas de resumen
  const exitosos = resultadosBatch.filter((r) => r.profesorElegido !== null).length;
  const fallidos = resultadosBatch.filter((r) => r.profesorElegido === null).length;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Pruebas de Asignación Automática</h1>

      {/* PANEL GENERADOR DE PRUEBAS AUTOMÁTICAS */}
      <section className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-6">
        <div className="border-b border-slate-700 pb-3 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold text-orange-400">
              ⚡ Generador Automático de Pruebas y Visualizador de Salidas (Outputs)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              El sistema generará escenarios aleatorios de asignación combinando materias, sedes, días y franjas horarias para evaluar las respuestas del algoritmo.
            </p>
          </div>
          <div className="flex space-x-2">
            <span className="bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-mono">
              {profesores.length} Docentes Cargados
            </span>
          </div>
        </div>

        {/* Formulario de Lanzamiento de Batería */}
        <div className="flex flex-wrap items-end gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Número de Escenarios Automáticos a Generar:
            </label>
            <select
              value={cantidadPruebas}
              onChange={(e) => setCantidadPruebas(Number(e.target.value))}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none"
            >
              <option value={3}>3 Pruebas</option>
              <option value={5}>5 Pruebas</option>
              <option value={10}>10 Pruebas</option>
              <option value={15}>15 Pruebas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={generarYEjecutarPruebasAutomated}
            disabled={ejecutandoBatch || loading}
            className="bg-[#0052B4] hover:bg-[#004098] text-white px-6 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-md cursor-pointer flex items-center gap-2"
          >
            🚀 Generar Entradas y Ejecutar Pruebas
          </button>
        </div>

        {/* VISTA DE OUTPUTS Y RESUMEN */}
        {resultadosBatch.length > 0 && (
          <div className="space-y-6 pt-2">
            {/* Tarjetas de Métricas Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-2xl font-mono font-extrabold text-blue-400">{resultadosBatch.length}</span>
                <span className="block text-xs text-slate-400 font-semibold mt-1">Total Escenarios Generados</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">{exitosos}</span>
                <span className="block text-xs text-slate-400 font-semibold mt-1">Asignaciones Exitosas</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-2xl font-mono font-extrabold text-rose-400">{fallidos}</span>
                <span className="block text-xs text-slate-400 font-semibold mt-1">Sin Docente Elegible</span>
              </div>
            </div>

            {/* Listado de Outputs Detallado */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Outputs Generados por Escenario:
              </h3>

              <div className="space-y-3">
                {resultadosBatch.map((res) => (
                  <div
                    key={res.idPrueba}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                  >
                    {/* Encabezado del Test */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded font-bold">
                          Escenario #{res.idPrueba}
                        </span>
                        <span className="text-xs font-bold text-blue-400">
                          Curso: {res.cursoCodigo} (Sede {res.sedeCurso})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded">
                          {res.materiaEvaluada}
                        </span>
                        <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                          {res.diaEvaluado} {res.bloqueEvaluado}
                        </span>
                      </div>
                    </div>

                    {/* Output Principal */}
                    {res.profesorElegido ? (
                      <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-bold text-white text-xs shadow"
                          style={{ backgroundColor: res.profesorElegido.color_hex || '#2563eb' }}
                        >
                          {res.profesorElegido.nombre[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-400 block">
                            ✅ OUTPUT: {res.profesorElegido.nombre} {res.profesorElegido.apellido}
                          </span>
                          <span className="text-[11px] text-slate-300">{res.motivoEleccion}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-lg text-xs text-rose-300">
                        ❌ <strong>OUTPUT: Sin docente elegible.</strong> {res.motivoEleccion}
                      </div>
                    )}

                    {/* Desglose de Descartes */}
                    {res.descartados.length > 0 && (
                      <details className="text-xs text-slate-400 cursor-pointer pt-1">
                        <summary className="hover:text-slate-200 font-semibold">
                          🔍 Ver razones de descarte de otros docentes ({res.descartados.length})
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900">
                          {res.descartados.map((d, idx) => (
                            <div key={idx} className="bg-slate-900 p-2 rounded text-[11px]">
                              <strong className="text-slate-300 block">{d.nombre}:</strong>
                              <span className="text-slate-400">{d.motivo}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}