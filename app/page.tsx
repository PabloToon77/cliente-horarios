'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Materia {
  id: number;
  nombre: string;
}

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  sede: string; // Guarda las sedes separadas por comas (ej. "Ambato, Latacunga")
  tipo_contrato: string;
  tarifa_hora_clase: number;
  tarifa_hora_admin: number;
  disponibilidad_json?: Record<string, string[]>;
  profesor_materia?: { materia_id: number; materias: Materia }[];
}

const SEDES_DISPONIBLES = [
  'Ambato',
  'Quito',
  'Riobamba',
  'Lago Agrio',
  'Loja',
  'Latacunga',
  'Puyo',
  'Salcedo',
  'Pujilí',
  'Píllaro',
  'Baños',
  'Coca',
  'Alausí',
  'Bucay',
  'Tena',
];

const TIPOS_CONTRATO = ['Tiempo Completo', 'Medio Tiempo', 'Por Horas'];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const BLOQUES_HORARIOS = [
  '07:00 - 09:00',
  '09:00 - 11:00',
  '11:00 - 13:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export default function DocentesPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [profesorEditandoId, setProfesorEditandoId] = useState<number | null>(null);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState<string[]>([SEDES_DISPONIBLES[0]]);
  const [tipoContrato, setTipoContrato] = useState(TIPOS_CONTRATO[0]);
  const [tarifaClase, setTarifaClase] = useState<number | ''>(0);
  const [tarifaAdmin, setTarifaAdmin] = useState<number | ''>(0);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<number[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, string[]>>({});

  const cargarDatos = async () => {
    setLoading(true);

    const { data: mData } = await supabase.from('materias').select('*').order('nombre');
    const { data: pData, error } = await supabase.from('profesores').select(`
      *,
      profesor_materia ( materia_id, materias ( id, nombre ) )
    `).order('nombre');

    if (error) console.error('Error cargando profesores:', error);
    else setProfesores(pData || []);

    setMaterias(mData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const limpiarFormulario = () => {
    setProfesorEditandoId(null);
    setNombre('');
    setApellido('');
    setCedula('');
    setEmail('');
    setTelefono('');
    setSedesSeleccionadas([SEDES_DISPONIBLES[0]]);
    setTipoContrato(TIPOS_CONTRATO[0]);
    setTarifaClase(0);
    setTarifaAdmin(0);
    setMateriasSeleccionadas([]);
    setDisponibilidad({});
  };

  const handleToggleSede = (s: string) => {
    setSedesSeleccionadas((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleToggleMateria = (materiaId: number) => {
    setMateriasSeleccionadas((prev) =>
      prev.includes(materiaId)
        ? prev.filter((id) => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleToggleDisponibilidad = (dia: string, bloque: string) => {
    setDisponibilidad((prev) => {
      const bloquesDia = prev[dia] || [];
      const yaExiste = bloquesDia.includes(bloque);
      const nuevosBloques = yaExiste
        ? bloquesDia.filter((b) => b !== bloque)
        : [...bloquesDia, bloque];

      return { ...prev, [dia]: nuevosBloques };
    });
  };

  const handleEditar = (p: Profesor) => {
    setProfesorEditandoId(p.id);
    setNombre(p.nombre);
    setApellido(p.apellido);
    setCedula(p.cedula || '');
    setEmail(p.email || '');
    setTelefono(p.telefono || '');
    
    // Convertir string de sedes a array
    const arraySedes = p.sede ? p.sede.split(',').map((s) => s.trim()) : [];
    setSedesSeleccionadas(arraySedes);

    setTipoContrato(p.tipo_contrato || TIPOS_CONTRATO[0]);
    setTarifaClase(p.tarifa_hora_clase || 0);
    setTarifaAdmin(p.tarifa_hora_admin || 0);

    const idsMaterias = p.profesor_materia?.map((pm) => pm.materia_id) || [];
    setMateriasSeleccionadas(idsMaterias);
    setDisponibilidad(p.disponibilidad_json || {});

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number, nombreCompleto: string) => {
    if (!confirm(`¿Eliminar al docente "${nombreCompleto}"?`)) return;

    const { error } = await supabase.from('profesores').delete().eq('id', id);
    if (error) alert('Error eliminando profesor: ' + error.message);
    else {
      if (profesorEditandoId === id) limpiarFormulario();
      cargarDatos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sedesSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una sede de trabajo.');
      return;
    }

    const sedeString = sedesSeleccionadas.join(', ');

    const datosProfesor = {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      sede: sedeString,
      tipo_contrato: tipoContrato,
      tarifa_hora_clase: Number(tarifaClase),
      tarifa_hora_admin: Number(tarifaAdmin),
      disponibilidad_json: disponibilidad,
    };

    let profId = profesorEditandoId;

    if (profId) {
      const { error } = await supabase.from('profesores').update(datosProfesor).eq('id', profId);
      if (error) {
        alert('Error actualizando docente: ' + error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from('profesores').insert([datosProfesor]).select();
      if (error) {
        alert('Error guardando docente: ' + error.message);
        return;
      }
      profId = data[0].id;
    }

    // Actualizar relación profesor_materia
    await supabase.from('profesor_materia').delete().eq('profesor_id', profId);

    if (materiasSeleccionadas.length > 0) {
      const relaciones = materiasSeleccionadas.map((mId) => ({
        profesor_id: profId,
        materia_id: mId,
      }));
      await supabase.from('profesor_materia').insert(relaciones);
    }

    alert('Docente guardado con éxito.');
    limpiarFormulario();
    cargarDatos();
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Docentes</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {profesorEditandoId ? '✏️ Editar Docente' : 'Registrar Nuevo Docente'}
          </h2>
          {profesorEditandoId && (
            <button type="button" onClick={limpiarFormulario} className="text-xs text-slate-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </div>

        {/* Datos Personales y Contractuales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombres</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Apellidos</label>
            <input
              type="text"
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Cédula / Identificación</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Teléfono / WhatsApp</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo de Contrato</label>
            <select
              value={tipoContrato}
              onChange={(e) => setTipoContrato(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              {TIPOS_CONTRATO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tarifa Hora Clase ($)</label>
            <input
              type="number"
              step="0.5"
              value={tarifaClase}
              onChange={(e) => setTarifaClase(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tarifa Hora Admin ($)</label>
            <input
              type="number"
              step="0.5"
              value={tarifaAdmin}
              onChange={(e) => setTarifaAdmin(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Selección Múltiple de Sedes */}
        <div className="border-t border-slate-700 pt-4 space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">
            🏛️ Sedes Habilitadas (Puedes seleccionar varias sedes simultáneamente):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
            {SEDES_DISPONIBLES.map((s) => {
              const checked = sedesSeleccionadas.includes(s);
              return (
                <label
                  key={s}
                  onClick={() => handleToggleSede(s)}
                  className={`flex items-center space-x-2 text-xs p-2 rounded cursor-pointer transition-colors border ${
                    checked
                      ? 'bg-blue-900/60 border-blue-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}} // Manejado por onClick del label
                    className="rounded text-blue-500 focus:ring-0"
                  />
                  <span>{s}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Selección de Materias */}
        <div className="border-t border-slate-700 pt-4 space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">
            📚 Materias Habilitadas que Imparte:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
            {materias.map((m) => {
              const checked = materiasSeleccionadas.includes(m.id);
              return (
                <label
                  key={m.id}
                  onClick={() => handleToggleMateria(m.id)}
                  className={`flex items-center space-x-2 text-xs p-2 rounded cursor-pointer transition-colors border ${
                    checked
                      ? 'bg-emerald-900/60 border-emerald-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span>{m.nombre}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Matriz de Disponibilidad Horaria */}
        <div className="border-t border-slate-700 pt-4 space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">
            ⏱️ Disponibilidad Horaria Semanal:
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="p-2 border border-slate-700">Bloque</th>
                  {DIAS_SEMANA.map((d) => (
                    <th key={d} className="p-2 border border-slate-700">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOQUES_HORARIOS.map((bloque) => (
                  <tr key={bloque} className="hover:bg-slate-800/80">
                    <td className="p-2 font-mono text-slate-400 border border-slate-700 font-semibold">{bloque}</td>
                    {DIAS_SEMANA.map((dia) => {
                      const estaDisponible = disponibilidad[dia]?.includes(bloque);
                      return (
                        <td
                          key={dia}
                          onClick={() => handleToggleDisponibilidad(dia, bloque)}
                          className={`p-2 border border-slate-700 cursor-pointer font-bold select-none transition-colors ${
                            estaDisponible
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900/50 text-slate-600 hover:bg-slate-800'
                          }`}
                        >
                          {estaDisponible ? '✓' : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
          >
            {profesorEditandoId ? 'Actualizar Docente' : 'Guardar Docente'}
          </button>
        </div>
      </form>

      {/* Lista de Docentes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Docentes Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando profesores...</p>
        ) : profesores.length === 0 ? (
          <p className="text-slate-500 italic">No hay docentes registrados aún.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Docente</th>
                  <th className="p-3.5 border-b">Sedes de Trabajo</th>
                  <th className="p-3.5 border-b">Contrato</th>
                  <th className="p-3.5 border-b">Tarifas (Clase / Admin)</th>
                  <th className="p-3.5 border-b">Materias</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {profesores.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">
                      {p.nombre} {p.apellido}
                      {p.cedula && <span className="block text-xs font-normal text-slate-500 font-mono">{p.cedula}</span>}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.sede ? (
                          p.sede.split(',').map((s) => (
                            <span key={s} className="bg-blue-50 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded border border-blue-200">
                              {s.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">Sin sede</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700">{p.tipo_contrato}</td>
                    <td className="p-3.5 font-mono text-xs">
                      ${p.tarifa_hora_clase \vert{}\vert{} 0} /${p.tarifa_hora_admin || 0}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.profesor_materia && p.profesor_materia.length > 0 ? (
                          p.profesor_materia.map((pm) => (
                            <span key={pm.materia_id} className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
                              {pm.materias?.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">Ninguna</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(p)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(p.id, `${p.nombre} ${p.apellido}`)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-xs px-2.5 py-1 rounded font-medium"
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