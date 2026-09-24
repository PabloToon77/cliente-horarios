'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BloqueHorario {
  id: string;
  dia: string;
  horaInicio: string;
  minutoInicio: string;
  horaFin: string;
  minutoFin: string;
}

interface Taller {
  nombre: string;
  clases: number;
}

interface Curso {
  id: number;
  codigo?: string;
  nombre: string;
  sede: string;
  apertura?: string;
  numero_curso?: string;
  anio_lectivo?: string;
  aula_fisica: string;
  periodo_lectivo: string;
  estado: string;
  malla_json?: Record<string, number>;
  talleres_json?: Taller[];
  horario_json?: BloqueHorario[];
}

// Mapeo de Sedes con sus respectivas 3 letras de código
const MAPEO_SEDES: Record<string, string> = {
  Ambato: 'AMB',
  Quito: 'QUI',
  Riobamba: 'RIO',
  'Lago Agrio': 'LAG',
  Loja: 'LOJ',
  Latacunga: 'LAT',
  Puyo: 'PUY',
  Salcedo: 'SAL',
  Pujilí: 'PUJ',
  Píllaro: 'PIL',
  Baños: 'BAN',
  Coca: 'COC',
  Alausí: 'ALA',
  Bucay: 'BUC',
  Tena: 'TEN',
};

const SEDES = Object.keys(MAPEO_SEDES);

// Opciones de Apertura condicionales por Ciclo
const APERTURAS_SIERRA = ['RS0', 'RS1', 'RS2', 'RS3', 'IS1', 'IS2', 'IS3', 'IS4'];
const APERTURAS_COSTA = ['RC0', 'RC1', 'RC2', 'RC3', 'IC1', 'IC2', 'IC3', 'IC4'];

const NUMEROS_CURSO = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
const ANIO_LECTIVO = '27';

const PERIODOS = ['Ciclo Sierra', 'Ciclo Costa'];

const MATERIAS_BASE = [
  'Matemáticas',
  'Física',
  'Química',
  'Biología',
  'Lengua y Literatura',
  'Historia / Ciencias Sociales',
  'Inglés',
  'Abstracto / Razonamiento',
  'Lógico',
  'Verbal',
  'OV',
];

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursoEditandoId, setCursoEditandoId] = useState<number | null>(null);

  // Formulario de Datos Generales y Código del Curso
  const [periodoLectivo, setPeriodoLectivo] = useState(PERIODOS[0]); // 'Ciclo Sierra' por defecto
  const [apertura, setApertura] = useState(APERTURAS_SIERRA[0]);
  const [sede, setSede] = useState(SEDES[0]);
  const [numeroCurso, setNumeroCurso] = useState(NUMEROS_CURSO[0]);
  const [nombre, setNombre] = useState('');
  const [aulaFisica, setAulaFisica] = useState('');
  const [estado, setEstado] = useState('Activo');

  // Formulario Malla Curricular
  const [malla, setMalla] = useState<Record<string, number>>({});

  // Formulario Talleres
  const [talleres, setTalleres] = useState<Taller[]>([]);

  // Formulario Horario
  const [horarios, setHorarios] = useState<BloqueHorario[]>([]);

  // Determinar lista de aperturas dinámicamente
  const opcionesApertura = periodoLectivo === 'Ciclo Sierra' ? APERTURAS_SIERRA : APERTURAS_COSTA;

  // Actualizar apertura por defecto si se cambia el ciclo
  const handlePeriodoChange = (nuevoPeriodo: string) => {
    setPeriodoLectivo(nuevoPeriodo);
    if (nuevoPeriodo === 'Ciclo Sierra') {
      setApertura(APERTURAS_SIERRA[0]);
    } else {
      setApertura(APERTURAS_COSTA[0]);
    }
  };

  // Generación dinámica del código
  const codigoGenerado = `${apertura}-${MAPEO_SEDES[sede] || 'AMB'}-${numeroCurso}-${ANIO_LECTIVO}`;

  const cargarCursos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cursos').select('*').order('nombre');
    if (error) console.error('Error cargando cursos:', error);
    else setCursos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const limpiarFormulario = () => {
    setCursoEditandoId(null);
    setPeriodoLectivo(PERIODOS[0]);
    setApertura(APERTURAS_SIERRA[0]);
    setSede(SEDES[0]);
    setNumeroCurso(NUMEROS_CURSO[0]);
    setNombre('');
    setAulaFisica('');
    setEstado('Activo');
    setMalla({});
    setTalleres([]);
    setHorarios([]);
  };

  const handleMallaChange = (materia: string, cantidad: number) => {
    setMalla((prev) => ({
      ...prev,
      [materia]: Math.max(0, cantidad),
    }));
  };

  // Talleres Handlers
  const agregarTaller = () => {
    setTalleres((prev) => [...prev, { nombre: '', clases: 1 }]);
  };

  const actualizarTaller = (index: number, campo: keyof Taller, valor: any) => {
    setTalleres((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
  };

  const eliminarTaller = (index: number) => {
    setTalleres((prev) => prev.filter((_, i) => i !== index));
  };

  // Horario Handlers
  const agregarBloqueHorario = () => {
    const nuevo: BloqueHorario = {
      id: Date.now().toString(),
      dia: 'Lunes',
      horaInicio: '08',
      minutoInicio: '00',
      horaFin: '09',
      minutoFin: '30',
    };
    setHorarios((prev) => [...prev, nuevo]);
  };

  const duplicarBloqueHorario = (bloque: BloqueHorario) => {
    const duplicado: BloqueHorario = {
      ...bloque,
      id: Date.now().toString(),
    };
    setHorarios((prev) => [...prev, duplicado]);
  };

  const actualizarBloqueHorario = (id: string, campo: keyof BloqueHorario, valor: string) => {
    setHorarios((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [campo]: valor } : b))
    );
  };

  const eliminarBloqueHorario = (id: string) => {
    setHorarios((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEditar = (c: Curso) => {
    setCursoEditandoId(c.id);
    const pLectivo = c.periodo_lectivo || PERIODOS[0];
    setPeriodoLectivo(pLectivo);
    setApertura(c.apertura || (pLectivo === 'Ciclo Sierra' ? APERTURAS_SIERRA[0] : APERTURAS_COSTA[0]));
    setSede(c.sede || SEDES[0]);
    setNumeroCurso(c.numero_curso || NUMEROS_CURSO[0]);
    setNombre(c.nombre);
    setAulaFisica(c.aula_fisica || '');
    setEstado(c.estado || 'Activo');
    setMalla(c.malla_json || {});
    setTalleres(c.talleres_json || []);
    setHorarios(c.horario_json || []);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number, nombreCurso: string) => {
    if (!confirm(`¿Eliminar el curso/paralelo "${nombreCurso}"?`)) return;

    const { error } = await supabase.from('cursos').delete().eq('id', id);
    if (error) alert('Error eliminando curso: ' + error.message);
    else {
      if (cursoEditandoId === id) limpiarFormulario();
      cargarCursos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cursoData = {
      codigo: codigoGenerado,
      apertura,
      sede,
      numero_curso: numeroCurso,
      anio_lectivo: ANIO_LECTIVO,
      nombre,
      aula_fisica: aulaFisica,
      periodo_lectivo: periodoLectivo,
      estado,
      malla_json: malla,
      talleres_json: talleres,
      horario_json: horarios,
    };

    if (cursoEditandoId) {
      const { error } = await supabase.from('cursos').update(cursoData).eq('id', cursoEditandoId);

      if (error) alert('Error actualizando curso: ' + error.message);
      else {
        alert('Curso actualizado con éxito.');
        limpiarFormulario();
        cargarCursos();
      }
    } else {
      const { error } = await supabase.from('cursos').insert([cursoData]);

      if (error) alert('Error creando curso: ' + error.message);
      else {
        alert('Curso guardado con éxito.');
        limpiarFormulario();
        cargarCursos();
      }
    }
  };

  const HORAS = Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, '0'));
  const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Cursos y Paralelos</h1>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {cursoEditandoId ? '✏️ Editar Curso / Paralelo' : 'Crear Nuevo Curso / Paralelo'}
          </h2>
          {cursoEditandoId && (
            <button type="button" onClick={limpiarFormulario} className="text-xs text-slate-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </div>

        {/* Selección del Período Lectivo / Ciclo primero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1">Período Lectivo / Ciclo *</label>
            <select
              value={periodoLectivo}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-orange-500/50 text-white font-semibold focus:outline-none focus:border-orange-500"
            >
              {PERIODOS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre Descriptivo del Curso</label>
            <input
              type="text"
              placeholder="Ej. Intensivo Preuniversitario - Grupo A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Aula Física</label>
            <input
              type="text"
              placeholder="Ej. Aula 102 / Lab 1"
              value={aulaFisica}
              onChange={(e) => setAulaFisica(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Generación de Código Único */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Código Único de Curso Generado:
            </span>
            <div className="bg-[#0052B4] text-white px-4 py-1.5 rounded-lg text-lg font-mono font-extrabold tracking-wider border border-blue-400/30 shadow-inner">
              {codigoGenerado}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                1. Apertura ({periodoLectivo === 'Ciclo Sierra' ? 'Sierra' : 'Costa'})
              </label>
              <select
                value={apertura}
                onChange={(e) => setApertura(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              >
                {opcionesApertura.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">2. Sede</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              >
                {SEDES.map((s) => (
                  <option key={s} value={s}>{s} ({MAPEO_SEDES[s]})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">3. Número de Curso</label>
              <select
                value={numeroCurso}
                onChange={(e) => setNumeroCurso(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              >
                {NUMEROS_CURSO.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">4. Año Lectivo</label>
              <input
                type="text"
                value={ANIO_LECTIVO}
                disabled
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono font-bold text-center cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Configuración de la Malla Curricular */}
        <div className="border-t border-slate-700 pt-4 space-y-3">
          <h3 className="font-semibold text-slate-200 text-sm">
            📚 Malla Curricular (Clases semanales requeridas por materia)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {MATERIAS_BASE.map((m) => (
              <div key={m} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <label className="block text-[11px] text-slate-300 font-medium truncate mb-1" title={m}>
                  {m}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={malla[m] ?? ''}
                  onChange={(e) => handleMallaChange(m, Number(e.target.value))}
                  className="w-full p-1.5 text-center rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Talleres Especiales */}
        <div className="border-t border-slate-700 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 text-sm">🛠️ Talleres Adicionales / Módulos Especiales</h3>
            <button
              type="button"
              onClick={agregarTaller}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1 rounded border border-slate-700 transition-colors"
            >
              + Agregar Taller
            </button>
          </div>

          {talleres.length > 0 && (
            <div className="space-y-2">
              {talleres.map((t, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <input
                    type="text"
                    placeholder="Nombre del Taller"
                    value={t.nombre}
                    onChange={(e) => actualizarTaller(idx, 'nombre', e.target.value)}
                    className="flex-1 p-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Clases"
                    value={t.clases}
                    onChange={(e) => actualizarTaller(idx, 'clases', Number(e.target.value))}
                    className="w-20 p-1.5 text-xs text-center rounded bg-slate-900 border border-slate-700 text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarTaller(idx)}
                    className="text-red-400 hover:text-red-300 px-2 text-xs"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Programación de Horario de Clases */}
        <div className="border-t border-slate-700 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 text-sm">
              ⏱️ Bloques y Horarios de Clases Programados
            </h3>
            <button
              type="button"
              onClick={agregarBloqueHorario}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1 rounded border border-slate-700 transition-colors"
            >
              + Agregar Bloque Horario
            </button>
          </div>

          {horarios.length > 0 && (
            <div className="space-y-2">
              {horarios.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-xs">
                  <select
                    value={b.dia}
                    onChange={(e) => actualizarBloqueHorario(b.id, 'dia', e.target.value)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <span className="text-slate-400">Inicio:</span>
                  <select
                    value={b.horaInicio}
                    onChange={(e) => actualizarBloqueHorario(b.id, 'horaInicio', e.target.value)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  :
                  <select
                    value={b.minutoInicio}
                    onChange={(e) => actualizarBloqueHorario(b.id, 'minutoInicio', e.target.value)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  >
                    {MINUTOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <span className="text-slate-400 ml-2">Fin:</span>
                  <select
                    value={b.horaFin}
                    onChange={(e) => actualizarBloqueHorario(b.id, 'horaFin', e.target.value)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  >
                    {HORAS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  :
                  <select
                    value={b.minutoFin}
                    onChange={(e) => actualizarBloqueHorario(b.id, 'minutoFin', e.target.value)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  >
                    {MINUTOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <div className="flex space-x-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => duplicarBloqueHorario(b)}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[11px]"
                    >
                      📋 Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarBloqueHorario(b.id)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#0052B4] hover:bg-[#004098] text-white px-8 py-2.5 rounded-lg font-bold transition-colors shadow-md cursor-pointer"
          >
            {cursoEditandoId ? 'Actualizar Curso' : 'Guardar Curso'}
          </button>
        </div>
      </form>

      {/* Lista de Cursos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Cursos y Paralelos Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando cursos...</p>
        ) : cursos.length === 0 ? (
          <p className="text-slate-500 italic">No hay cursos o paralelos registrados.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Código Único</th>
                  <th className="p-3.5 border-b">Nombre del Curso</th>
                  <th className="p-3.5 border-b">Sede</th>
                  <th className="p-3.5 border-b">Aula</th>
                  <th className="p-3.5 border-b">Período</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cursos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="bg-blue-50 text-[#0052B4] border border-blue-200 font-mono font-extrabold text-xs px-2.5 py-1 rounded-md">
                        {c.codigo || `${c.apertura || 'RS0'}-${MAPEO_SEDES[c.sede] || 'AMB'}-${c.numero_curso || '01'}-27`}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{c.nombre}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{c.sede}</td>
                    <td className="p-3.5 text-slate-600">{c.aula_fisica || 'Sin aula'}</td>
                    <td className="p-3.5 text-slate-600">{c.periodo_lectivo || 'N/A'}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(c)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded font-medium cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(c.id, c.nombre)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-xs px-2.5 py-1 rounded font-medium cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
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