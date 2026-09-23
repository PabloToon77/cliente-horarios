'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  sede: string;
}

interface ActividadExtra {
  id: number;
  profesor_id: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo_actividad: string;
  horas_dedicadas: number;
  estado: string;
  profesores?: { nombre: string; apellido: string; sede: string };
}

const TIPOS_ACTIVIDAD = [
  'Hora Clase Extra',
  'Hora Admin Extra',
  'Reunión / Evento Imprevisto',
  'Tutoría Extraordinaria',
  'Otro',
];

export default function ActividadesExtrasPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [actividades, setActividades] = useState<ActividadExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [actividadEditandoId, setActividadEditandoId] = useState<number | null>(null);

  // Formulario
  const [profesorId, setProfesorId] = useState<number | ''>('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoActividad, setTipoActividad] = useState(TIPOS_ACTIVIDAD[0]);
  const [horasDedicadas, setHorasDedicadas] = useState<number | ''>(1);
  const [estado, setEstado] = useState('Aprobado');

  const cargarDatos = async () => {
    setLoading(true);

    const { data: pData } = await supabase.from('profesores').select('id, nombre, apellido, sede').order('nombre');
    const { data: aData, error } = await supabase
      .from('actividades_extras')
      .select(`
        *,
        profesores ( nombre, apellido, sede )
      `)
      .order('fecha', { ascending: false });

    if (error) console.error('Error cargando actividades:', error);
    else setActividades(aData || []);

    setProfesores(pData || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const limpiarFormulario = () => {
    setActividadEditandoId(null);
    setProfesorId('');
    setFecha(new Date().toISOString().split('T')[0]);
    setTitulo('');
    setDescripcion('');
    setTipoActividad(TIPOS_ACTIVIDAD[0]);
    setHorasDedicadas(1);
    setEstado('Aprobado');
  };

  const handleEditar = (act: ActividadExtra) => {
    setActividadEditandoId(act.id);
    setProfesorId(act.profesor_id);
    setFecha(act.fecha);
    setTitulo(act.titulo);
    setDescripcion(act.descripcion || '');
    setTipoActividad(act.tipo_actividad || TIPOS_ACTIVIDAD[0]);
    setHorasDedicadas(act.horas_dedicadas);
    setEstado(act.estado || 'Aprobado');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number, t: string) => {
    if (!confirm(`¿Estás seguro de eliminar la actividad "${t}"?`)) return;

    const { error } = await supabase.from('actividades_extras').delete().eq('id', id);
    if (error) alert('Error eliminando actividad: ' + error.message);
    else {
      if (actividadEditandoId === id) limpiarFormulario();
      cargarDatos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profesorId) {
      alert('Por favor selecciona un docente.');
      return;
    }

    if (actividadEditandoId) {
      const { error } = await supabase
        .from('actividades_extras')
        .update({
          profesor_id: Number(profesorId),
          fecha,
          titulo,
          descripcion,
          tipo_actividad: tipoActividad,
          horas_dedicadas: Number(horasDedicadas),
          estado,
        })
        .eq('id', actividadEditandoId);

      if (error) alert('Error actualizando actividad: ' + error.message);
      else {
        alert('Actividad registrada/actualizada con éxito.');
        limpiarFormulario();
        cargarDatos();
      }
    } else {
      const { error } = await supabase.from('actividades_extras').insert([
        {
          profesor_id: Number(profesorId),
          fecha,
          titulo,
          descripcion,
          tipo_actividad: tipoActividad,
          horas_dedicadas: Number(horasDedicadas),
          estado,
        },
      ]);

      if (error) alert('Error guardando actividad: ' + error.message);
      else {
        alert('Actividad registrada con éxito.');
        limpiarFormulario();
        cargarDatos();
      }
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Registro de Actividades Extras Imprevistas</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {actividadEditandoId ? '✏️ Editar Actividad Extra' : 'Registrar Nueva Actividad Extra'}
          </h2>
          {actividadEditandoId && (
            <button type="button" onClick={limpiarFormulario} className="text-xs text-slate-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Docente</label>
            <select
              value={profesorId}
              onChange={(e) => setProfesorId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Selecciona el Docente --</option>
              {profesores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} ({p.sede})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha de la Actividad</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo de Actividad</label>
            <select
              value={tipoActividad}
              onChange={(e) => setTipoActividad(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              {TIPOS_ACTIVIDAD.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Título / Nombre de la Actividad</label>
            <input
              type="text"
              placeholder="Ej. Reunión extraordinaria de docentes / Reemplazo Grupo B"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Horas Dedicadas</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={horasDedicadas}
              onChange={(e) => setHorasDedicadas(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Descripción / Observaciones (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Cobertura de imprevisto por ausencia autorizada"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Estado de Aprobación</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
          >
            {actividadEditandoId ? 'Actualizar Actividad' : 'Guardar Actividad Extra'}
          </button>
        </div>
      </form>

      {/* Listado de Actividades Registradas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Historial de Actividades Extras Registradas</h2>
        {loading ? (
          <p className="text-slate-500">Cargando registro de actividades...</p>
        ) : actividades.length === 0 ? (
          <p className="text-slate-500 italic">No hay actividades extras registradas aún.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Fecha</th>
                  <th className="p-3.5 border-b">Docente</th>
                  <th className="p-3.5 border-b">Actividad / Título</th>
                  <th className="p-3.5 border-b">Tipo</th>
                  <th className="p-3.5 border-b">Horas</th>
                  <th className="p-3.5 border-b">Estado</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {actividades.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-800 font-medium whitespace-nowrap">{a.fecha}</td>
                    <td className="p-3.5 font-medium text-slate-900">
                      {a.profesores ? `${a.profesores.nombre} ${a.profesores.apellido}` : 'Docente eliminado'}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{a.titulo}</p>
                      {a.descripcion && <p className="text-xs text-slate-500">{a.descripcion}</p>}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 font-medium">{a.tipo_actividad}</td>
                    <td className="p-3.5 font-bold text-blue-700">{a.horas_dedicadas} h</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          a.estado === 'Aprobado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.estado === 'Pendiente'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.estado}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(a)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(a.id, a.titulo)}
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