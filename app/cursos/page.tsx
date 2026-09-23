'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Curso {
  id: number;
  nombre: string;
  sede: string;
  jornada: string;
  estado: string;
  aula_fisica: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horario_json?: Record<string, string[]>;
  malla_json?: Record<string, number>;
  talleres_json?: Array<{ nombre: string; clases: number }>;
}

const SEDES = ['Ambato', 'Quito', 'Riobamba', 'Lago Agrio', 'Loja', 'Latacunga', 'Puyo'];
const JORNADAS = [
  'Matutina (08:00 - 12:00)',
  'Vespertina (14:00 - 18:00)',
  'Nocturna (18:00 - 21:00)',
  'Intensivo Fin de Semana',
];

const MATERIAS_BASE = [
  'Matemáticas',
  'Química',
  'Física',
  'Biología',
  'Lengua',
  'Ciencias Sociales',
  'Razonamiento Numérico',
  'Razonamiento Verbal',
  'Razonamiento Lógico',
];

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const BLOQUES_HORARIOS = [
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
  '19:00 - 20:00',
];

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos básicos del formulario
  const [nombre, setNombre] = useState('');
  const [sede, setSede] = useState('Ambato');
  const [jornada, setJornada] = useState(JORNADAS[0]);
  const [estado, setEstado] = useState('Activo');
  const [aulaFisica, setAulaFisica] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cantidad de clases por materia
  const [clasesMaterias, setClasesMaterias] = useState<Record<string, number>>({});

  // Lista de talleres adicionales
  const [talleres, setTalleres] = useState<Array<{ nombre: string; clases: number }>>([]);
  const [nuevoTallerNombre, setNuevoTallerNombre] = useState('');
  const [nuevoTallerClases, setNuevoTallerClases] = useState<number | ''>('');

  // Matriz de Horarios del Curso (Día -> Lista de bloques)
  const [horarioCurso, setHorarioCurso] = useState<Record<string, string[]>>({});

  const cargarCursos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cursos').select('*').order('id', { ascending: false });
    if (error) console.error('Error cargando cursos:', error);
    else setCursos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  // Control del horario individual
  const toggleHorario = (dia: string, bloque: string) => {
    const horasDia = horarioCurso[dia] || [];
    let nuevasHoras: string[];

    if (horasDia.includes(bloque)) {
      nuevasHoras = horasDia.filter((h) => h !== bloque);
    } else {
      nuevasHoras = [...horasDia, bloque];
    }

    setHorarioCurso({
      ...horarioCurso,
      [dia]: nuevasHoras,
    });
  };

  // Control de DÍA COMPLETO
  const toggleDiaCompleto = (dia: string) => {
    const horasDia = horarioCurso[dia] || [];
    const estaTodoCompleto = BLOQUES_HORARIOS.every((bloque) => horasDia.includes(bloque));

    setHorarioCurso({
      ...horarioCurso,
      [dia]: estaTodoCompleto ? [] : [...BLOQUES_HORARIOS],
    });
  };

  // Manejo de número de clases por materia
  const handleMateriaClasesChange = (materia: string, valor: number) => {
    setClasesMaterias({
      ...clasesMaterias,
      [materia]: Math.max(0, valor),
    });
  };

  // Agregar un taller a la lista
  const handleAgregarTaller = () => {
    if (!nuevoTallerNombre.trim() || !nuevoTallerClases || Number(nuevoTallerClases) <= 0) {
      alert('Por favor ingresa un nombre válido y un número de clases para el taller.');
      return;
    }

    setTalleres([
      ...talleres,
      { nombre: nuevoTallerNombre.trim(), clases: Number(nuevoTallerClases) },
    ]);
    setNuevoTallerNombre('');
    setNuevoTallerClases('');
  };

  // Eliminar taller de la lista
  const handleEliminarTaller = (index: number) => {
    setTalleres(talleres.filter((_, i) => i !== index));
  };

  // Guardar Curso completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('cursos').insert([
      {
        nombre,
        sede,
        jornada,
        estado,
        aula_fisica: aulaFisica,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        malla_json: clasesMaterias,
        talleres_json: talleres,
        horario_json: horarioCurso,
      },
    ]);

    if (error) {
      alert('Error guardando curso: ' + error.message);
    } else {
      alert('¡Curso registrado con éxito!');
      // Limpiar Formulario
      setNombre('');
      setSede('Ambato');
      setJornada(JORNADAS[0]);
      setEstado('Activo');
      setAulaFisica('');
      setFechaInicio('');
      setFechaFin('');
      setClasesMaterias({});
      setTalleres([]);
      setHorarioCurso({});
      cargarCursos();
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Cursos y Paralelos</h1>

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Crear Nuevo Curso / Grupo</h2>

        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-xs text-slate-400 mb-1">Sede Principal</label>
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
            <label className="block text-xs text-slate-400 mb-1">Estado del Curso</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Activo">Activo</option>
              <option value="Cerrado">Cerrado</option>
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
            <label className="block text-xs text-slate-400 mb-1">Nombre del Aula Física</label>
            <input
              type="text"
              placeholder="Ej. Aula 102 / Lab 3"
              value={aulaFisica}
              onChange={(e) => setAulaFisica(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
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

        {/* Cantidad de Clases por Materia Base */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Malla Curricular (Número de Clases requeridas por Materia):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-800/40 p-4 rounded-lg border border-slate-700">
            {MATERIAS_BASE.map((materia) => (
              <div key={materia} className="flex items-center justify-between bg-slate-800 p-2.5 rounded border border-slate-700">
                <span className="text-xs text-slate-200 font-medium">{materia}</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={clasesMaterias[materia] || ''}
                    onChange={(e) => handleMateriaClasesChange(materia, Number(e.target.value))}
                    className="w-16 p-1 text-center text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">clases</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Talleres Adicionales */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Agregar Talleres Especiales (Opcional):
          </label>
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Nombre del Taller (Ej. Taller de Orientación Vocacional)"
                value={nuevoTallerNombre}
                onChange={(e) => setNuevoTallerNombre(e.target.value)}
                className="flex-1 p-2 rounded bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min="1"
                placeholder="N° de clases"
                value={nuevoTallerClases}
                onChange={(e) => setNuevoTallerClases(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-28 p-2 rounded bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAgregarTaller}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded font-medium transition-colors"
              >
                + Agregar Taller
              </button>
            </div>

            {talleres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {talleres.map((t, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-2 bg-slate-800 border border-emerald-500/50 text-emerald-300 text-xs px-3 py-1 rounded-full"
                  >
                    <span>{t.nombre} ({t.clases} clases)</span>
                    <button
                      type="button"
                      onClick={() => handleEliminarTaller(index)}
                      className="text-slate-400 hover:text-red-400 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Matriz de Horarios de Clases para el Curso */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-300">
              Horario del Curso (Días y horas en las que se dictarán clases):
            </label>
            <span className="text-xs text-slate-400 italic">
              * Presiona "+ Día Completo" para seleccionar la jornada completa con un solo clic.
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800/30 p-4">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-slate-700 text-slate-400">Franja Horaria</th>
                  {DIAS_SEMANA.map((dia) => {
                    const horasDia = horarioCurso[dia] || [];
                    const estaTodoCompleto = BLOQUES_HORARIOS.every((b) => horasDia.includes(b));

                    return (
                      <th key={dia} className="p-2 border-b border-slate-700 space-y-1">
                        <div className="text-slate-300 font-semibold">{dia}</div>
                        <button
                          type="button"
                          onClick={() => toggleDiaCompleto(dia)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            estaTodoCompleto
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                          }`}
                        >
                          {estaTodoCompleto ? '✓ Día Completo' : '+ Día Completo'}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {BLOQUES_HORARIOS.map((bloque) => (
                  <tr key={bloque} className="hover:bg-slate-800/50">
                    <td className="p-2 font-mono text-slate-400 font-medium whitespace-nowrap">{bloque}</td>
                    {DIAS_SEMANA.map((dia) => {
                      const estaSeleccionado = (horarioCurso[dia] || []).includes(bloque);
                      return (
                        <td key={dia} className="p-1">
                          <button
                            type="button"
                            onClick={() => toggleHorario(dia, bloque)}
                            className={`w-full py-1.5 px-2 rounded font-medium transition-colors ${
                              estaSeleccionado
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                            }`}
                          >
                            {estaSeleccionado ? 'Clase' : '-'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-base shadow-md"
        >
          Guardar Curso
        </button>
      </form>

      {/* Lista de Cursos Registrados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Cursos Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p className="text-slate-500 italic">No hay cursos registrados aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cursos.map((c) => (
              <div key={c.id} className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{c.nombre}</h3>
                    <p className="text-xs text-slate-500">Aula: <span className="font-medium text-slate-700">{c.aula_fisica}</span></p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                      {c.sede}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.estado === 'Activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.estado || 'Activo'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <p>Jornada: <span className="font-medium text-slate-800">{c.jornada}</span></p>
                  {c.fecha_inicio && c.fecha_fin && (
                    <p>Período: <span className="font-medium text-slate-800">{c.fecha_inicio} al {c.fecha_fin}</span></p>
                  )}
                </div>

                {/* Mostrar resumen de talleres si existen */}
                {c.talleres_json && c.talleres_json.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700">Talleres: </span>
                    {c.talleres_json.map((t, i) => (
                      <span key={i} className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] mr-1 mt-1">
                        {t.nombre} ({t.clases} cl.)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}