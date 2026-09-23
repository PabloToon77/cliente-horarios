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
  estado: string;
  aula_fisica: string;
  periodo_lectivo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horario_json?: BloqueClase[];
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

// Horas de 00 a 23
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

// Minutos de 5 en 5 (00, 05, 10, ..., 55)
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos básicos del formulario
  const [nombre, setNombre] = useState('');
  const [sede, setSede] = useState('Ambato');
  const [jornada, setJornada] = useState(JORNADAS[0]);
  const [estado, setEstado] = useState('Activo');
  const [aulaFisica, setAulaFisica] = useState('');
  const [periodoLectivo, setPeriodoLectivo] = useState('2026-I');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cantidad de clases por materia
  const [clasesMaterias, setClasesMaterias] = useState<Record<string, number>>({});

  // Lista de talleres
  const [talleres, setTalleres] = useState<Array<{ nombre: string; clases: number }>>([]);
  const [nuevoTallerNombre, setNuevoTallerNombre] = useState('');
  const [nuevoTallerClases, setNuevoTallerClases] = useState<number | ''>('');

  // Lista de Bloques de Clase
  const [bloques, setBloques] = useState<BloqueClase[]>([]);

  // Campos para nuevo bloque de clase
  const [diaSel, setDiaSel] = useState('Lunes');
  const [hInicioSel, setHInicioSel] = useState('08');
  const [mInicioSel, setMInicioSel] = useState('00');
  const [hFinSel, setHFinSel] = useState('09');
  const [mFinSel, setMFinSel] = useState('00');

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

  // Agregar bloque manual
  const handleAgregarClase = () => {
    const inicioMin = Number(hInicioSel) * 60 + Number(mInicioSel);
    const finMin = Number(hFinSel) * 60 + Number(mFinSel);

    if (finMin <= inicioMin) {
      alert('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const nuevoBloque: BloqueClase = {
      id: Math.random().toString(36).substring(2, 9),
      dia: diaSel,
      horaInicio: hInicioSel,
      minutoInicio: mInicioSel,
      horaFin: hFinSel,
      minutoFin: mFinSel,
    };

    setBloques([...bloques, nuevoBloque]);
  };

  // Duplicar bloque de clase
  const handleDuplicarClase = (bloque: BloqueClase) => {
    const bloqueDuplicado: BloqueClase = {
      ...bloque,
      id: Math.random().toString(36).substring(2, 9),
    };
    setBloques([...bloques, bloqueDuplicado]);
  };

  // Eliminar bloque de clase
  const handleEliminarClase = (id: string) => {
    setBloques(bloques.filter((b) => b.id !== id));
  };

  // Asignar clases por materia
  const handleMateriaClasesChange = (materia: string, valor: number) => {
    setClasesMaterias({
      ...clasesMaterias,
      [materia]: Math.max(0, valor),
    });
  };

  // Agregar Taller
  const handleAgregarTaller = () => {
    if (!nuevoTallerNombre.trim() || !nuevoTallerClases || Number(nuevoTallerClases) <= 0) {
      alert('Ingresa un nombre y número de clases válido para el taller.');
      return;
    }

    setTalleres([
      ...talleres,
      { nombre: nuevoTallerNombre.trim(), clases: Number(nuevoTallerClases) },
    ]);
    setNuevoTallerNombre('');
    setNuevoTallerClases('');
  };

  const handleEliminarTaller = (index: number) => {
    setTalleres(talleres.filter((_, i) => i !== index));
  };

  // Guardar en Supabase enviando periodo_lectivo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('cursos').insert([
      {
        nombre,
        sede,
        jornada,
        estado,
        aula_fisica: aulaFisica,
        periodo_lectivo: periodoLectivo, // <-- Se envía el campo obligatorio
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        malla_json: clasesMaterias,
        talleres_json: talleres,
        horario_json: bloques,
      },
    ]);

    if (error) {
      alert('Error guardando curso: ' + error.message);
    } else {
      alert('¡Curso guardado con éxito!');
      setNombre('');
      setSede('Ambato');
      setJornada(JORNADAS[0]);
      setEstado('Activo');
      setAulaFisica('');
      setPeriodoLectivo('2026-I');
      setFechaInicio('');
      setFechaFin('');
      setClasesMaterias({});
      setTalleres([]);
      setBloques([]);
      cargarCursos();
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Cursos y Paralelos</h1>

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
            <label className="block text-xs text-slate-400 mb-1">Período Lectivo</label>
            <input
              type="text"
              placeholder="Ej. 2026-I / Costa 2026"
              value={periodoLectivo}
              onChange={(e) => setPeriodoLectivo(e.target.value)}
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

        {/* Malla Curricular por Materias */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Malla Curricular (Clases requeridas por Materia):
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

        {/* Talleres Especiales */}
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

        {/* Selector de Horarios Manual */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">
            Horario de Clases (Agregar bloques de hora manualmente):
          </label>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Día de la semana</label>
                <select
                  value={diaSel}
                  onChange={(e) => setDiaSel(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Hora de Inicio</label>
                <div className="flex items-center space-x-1">
                  <select
                    value={hInicioSel}
                    onChange={(e) => setHInicioSel(e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h} h</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={mInicioSel}
                    onChange={(e) => setMInicioSel(e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {MINUTOS.map((m) => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Hora de Fin</label>
                <div className="flex items-center space-x-1">
                  <select
                    value={hFinSel}
                    onChange={(e) => setHFinSel(e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h} h</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={mFinSel}
                    onChange={(e) => setMFinSel(e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {MINUTOS.map((m) => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAgregarClase}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              + Agregar Clase
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clases Programadas ({bloques.length})
            </h4>

            {bloques.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No has agregado bloques de clase todavía.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {bloques.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs"
                  >
                    <div>
                      <span className="font-bold text-blue-400 block">{b.dia}</span>
                      <span className="font-mono text-slate-200">
                        {b.horaInicio}:{b.minutoInicio} - {b.horaFin}:{b.minutoFin}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicarClase(b)}
                        title="Duplicar esta clase"
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                      >
                        📋 Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarClase(b.id)}
                        title="Eliminar clase"
                        className="text-slate-400 hover:text-red-400 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <p className="text-xs text-slate-500">
                      Aula: <span className="font-medium text-slate-700">{c.aula_fisica}</span>
                      {c.periodo_lectivo && (
                        <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                          {c.periodo_lectivo}
                        </span>
                      )}
                    </p>
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

                {/* Resumen de Clases Programadas */}
                {c.horario_json && Array.isArray(c.horario_json) && c.horario_json.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-slate-700 block">Horario Agendado ({c.horario_json.length} clases):</span>
                    <div className="flex flex-wrap gap-1">
                      {c.horario_json.map((b, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                          {b.dia} {b.horaInicio}:{b.minutoInicio}-{b.horaFin}:{b.minutoFin}
                        </span>
                      ))}
                    </div>
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