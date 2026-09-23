'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  sede: string;
  tipo_contrato: string;
  horas_max_semanales: number;
  tarifa_hora_clase: number;
  tarifa_hora_admin: number;
  disponibilidad_json?: Record<string, string[]>;
  profesor_materia?: { materias: { id: number; nombre: string } }[];
}

interface Materia {
  id: number;
  nombre: string;
}

const SEDES = [
  'Ambato',
  'Quito',
  'Riobamba',
  'Lago Agrio',
  'Loja',
  'Latacunga',
  'Puyo',
];

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

export default function Home() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [materiasDB, setMateriasDB] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para saber si estamos editando
  const [profesorEditandoId, setProfesorEditandoId] = useState<number | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [sede, setSede] = useState('Ambato');
  const [tipoContrato, setTipoContrato] = useState('Tiempo completo (40h)');
  const [tarifaClase, setTarifaClase] = useState<number | ''>('');
  const [tarifaAdmin, setTarifaAdmin] = useState<number | ''>('');
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);

  // Matriz de Disponibilidad
  const [disponibilidad, setDisponibilidad] = useState<Record<string, string[]>>({});

  const inicializarDatos = async () => {
    setLoading(true);

    for (const matNombre of MATERIAS_DISPONIBLES) {
      const codigo = matNombre.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
      await supabase.from('materias').upsert(
        { nombre: matNombre, codigo },
        { onConflict: 'codigo', ignoreDuplicates: true }
      );
    }

    const { data: mData } = await supabase.from('materias').select('*');
    setMateriasDB(mData || []);

    const { data: pData, error } = await supabase.from('profesores').select(`
      *,
      profesor_materia (
        materias ( id, nombre )
      )
    `).order('id', { ascending: false });

    if (error) console.error('Error cargando profesores:', error);
    else setProfesores(pData || []);

    setLoading(false);
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

  const handleCheckboxChange = (materiaNombre: string) => {
    if (materiasSeleccionadas.includes(materiaNombre)) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter((m) => m !== materiaNombre));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materiaNombre]);
    }
  };

  const toggleHorario = (dia: string, bloque: string) => {
    const horasDia = disponibilidad[dia] || [];
    let nuevasHoras: string[];

    if (horasDia.includes(bloque)) {
      nuevasHoras = horasDia.filter((h) => h !== bloque);
    } else {
      nuevasHoras = [...horasDia, bloque];
    }

    setDisponibilidad({
      ...disponibilidad,
      [dia]: nuevasHoras,
    });
  };

  const toggleDiaCompleto = (dia: string) => {
    const horasDia = disponibilidad[dia] || [];
    const estaTodoCompleto = BLOQUES_HORARIOS.every((bloque) => horasDia.includes(bloque));

    setDisponibilidad({
      ...disponibilidad,
      [dia]: estaTodoCompleto ? [] : [...BLOQUES_HORARIOS],
    });
  };

  const limpiarFormulario = () => {
    setProfesorEditandoId(null);
    setNombre('');
    setApellido('');
    setEmail('');
    setSede('Ambato');
    setTipoContrato('Tiempo completo (40h)');
    setTarifaClase('');
    setTarifaAdmin('');
    setMateriasSeleccionadas([]);
    setDisponibilidad({});
  };

  // Cargar datos de un profesor en el formulario para editar
  const handleEditar = (prof: Profesor) => {
    setProfesorEditandoId(prof.id);
    setNombre(prof.nombre || '');
    setApellido(prof.apellido || '');
    setEmail(prof.email || '');
    setSede(prof.sede || 'Ambato');
    setTipoContrato(prof.tipo_contrato || 'Tiempo completo (40h)');
    setTarifaClase(prof.tarifa_hora_clase || '');
    setTarifaAdmin(prof.tarifa_hora_admin || '');
    setDisponibilidad(prof.disponibilidad_json || {});

    // Extraer materias asignadas
    const mats = prof.profesor_materia
      ?.map((pm) => pm.materias?.nombre)
      .filter((n): n is string => Boolean(n)) || [];
    setMateriasSeleccionadas(mats);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Eliminar un docente
  const handleEliminar = async (id: number, nombreProfesor: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al docente ${nombreProfesor}?`);
    if (!confirmar) return;

    // Supabase elimina automáticamente las relaciones en profesor_materia si está configurado ON DELETE CASCADE
    const { error } = await supabase.from('profesores').delete().eq('id', id);

    if (error) {
      alert('Error eliminando profesor: ' + error.message);
    } else {
      alert('Profesor eliminado con éxito.');
      if (profesorEditandoId === id) {
        limpiarFormulario();
      }
      inicializarDatos();
    }
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (materiasSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una materia que el profesor pueda impartir.');
      return;
    }

    let horasMax = 40;
    if (tipoContrato === 'Medio tiempo (20h)') horasMax = 20;
    if (tipoContrato === 'Por horas') horasMax = 0;

    const tarifaClaseVal = tipoContrato === 'Por horas' ? Number(tarifaClase) || 0 : 0;
    const tarifaAdminVal = tipoContrato === 'Por horas' ? Number(tarifaAdmin) || 0 : 0;

    if (profesorEditandoId) {
      // ACTUALIZAR DOCENTE EXISTENTE
      const { error: errorProf } = await supabase
        .from('profesores')
        .update({
          nombre,
          apellido,
          email,
          sede,
          tipo_contrato: tipoContrato,
          horas_max_semanales: horasMax,
          tarifa_hora_clase: tarifaClaseVal,
          tarifa_hora_admin: tarifaAdminVal,
          disponibilidad_json: disponibilidad,
        })
        .eq('id', profesorEditandoId);

      if (errorProf) {
        alert('Error actualizando profesor: ' + errorProf.message);
        return;
      }

      // Eliminar relaciones de materias viejas y volver a insertar las nuevas
      await supabase.from('profesor_materia').delete().eq('profesor_id', profesorEditandoId);

      const relacionesMaterias = materiasSeleccionadas.map((matNombre) => {
        const matObj = materiasDB.find((m) => m.nombre === matNombre);
        return {
          profesor_id: profesorEditandoId,
          materia_id: matObj?.id,
        };
      });

      await supabase.from('profesor_materia').insert(relacionesMaterias);

      alert('¡Profesor actualizado con éxito!');
      limpiarFormulario();
      inicializarDatos();

    } else {
      // CREAR NUEVO DOCENTE
      const { data: nuevoProf, error: errorProf } = await supabase
        .from('profesores')
        .insert([
          {
            nombre,
            apellido,
            email,
            sede,
            tipo_contrato: tipoContrato,
            horas_max_semanales: horasMax,
            tarifa_hora_clase: tarifaClaseVal,
            tarifa_hora_admin: tarifaAdminVal,
            disponibilidad_json: disponibilidad,
          },
        ])
        .select()
        .single();

      if (errorProf) {
        alert('Error guardando profesor: ' + errorProf.message);
        return;
      }

      const relacionesMaterias = materiasSeleccionadas.map((matNombre) => {
        const matObj = materiasDB.find((m) => m.nombre === matNombre);
        return {
          profesor_id: nuevoProf.id,
          materia_id: matObj?.id,
        };
      });

      const { error: errorRel } = await supabase.from('profesor_materia').insert(relacionesMaterias);

      if (errorRel) {
        alert('Error asociando materias: ' + errorRel.message);
      } else {
        alert('¡Profesor guardado con éxito!');
        limpiarFormulario();
        inicializarDatos();
      }
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Docentes</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {profesorEditandoId ? '✏️ Editar Profesor' : 'Registrar Nuevo Profesor'}
          </h2>
          {profesorEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Cancelar Edición
            </button>
          )}
        </div>

        {/* Datos Personales y Sede */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Ej. Carlos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Apellido</label>
            <input
              type="text"
              placeholder="Ej. Mendoza"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="docente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Relación de Dependencia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-lg border border-slate-700">
          <div className="md:col-span-1">
            <label className="block text-xs text-slate-400 mb-1">Relación de Dependencia</label>
            <select
              value={tipoContrato}
              onChange={(e) => setTipoContrato(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Tiempo completo (40h)">Tiempo Completo (40 hrs/sem)</option>
              <option value="Medio tiempo (20h)">Medio Tiempo (20 hrs/sem)</option>
              <option value="Por horas">Por Horas</option>
            </select>
          </div>

          {tipoContrato === 'Por horas' ? (
            <>
              <div>
                <label className="block text-xs text-blue-400 font-medium mb-1">
                  Valor por Hora de Clase ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 12.50"
                  value={tarifaClase}
                  onChange={(e) => setTarifaClase(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-blue-500/50 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-400 font-medium mb-1">
                  Valor por Hora Administrativa ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 8.00"
                  value={tarifaAdmin}
                  onChange={(e) => setTarifaAdmin(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-blue-500/50 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 flex items-center text-xs text-slate-400 italic">
              * El tipo de contrato incluye una carga horaria regulada por salario mensual predeterminado.
            </div>
          )}
        </div>

        {/* Selección de Materias */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Materias Habilitadas:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            {MATERIAS_DISPONIBLES.map((materia) => (
              <label key={materia} className="flex items-center space-x-2 text-sm cursor-pointer hover:text-blue-400">
                <input
                  type="checkbox"
                  checked={materiasSeleccionadas.includes(materia)}
                  onChange={() => handleCheckboxChange(materia)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
                />
                <span>{materia}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Matriz de Disponibilidad Horaria */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-300">
              Disponibilidad Horaria:
            </label>
            <span className="text-xs text-slate-400 italic">
              * Usa el botón en el encabezado del día para marcar todo el día completo.
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800/30 p-4">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-slate-700 text-slate-400">Franja Horaria</th>
                  {DIAS_SEMANA.map((dia) => {
                    const horasDia = disponibilidad[dia] || [];
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
                      const estaSeleccionado = (disponibilidad[dia] || []).includes(bloque);
                      return (
                        <td key={dia} className="p-1">
                          <button
                            type="button"
                            onClick={() => toggleHorario(dia, bloque)}
                            className={`w-full py-1.5 px-2 rounded font-medium transition-colors ${
                              estaSeleccionado
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                            }`}
                          >
                            {estaSeleccionado ? 'Disponible' : '-'}
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

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-base shadow-md"
          >
            {profesorEditandoId ? 'Actualizar Profesor' : 'Guardar Profesor'}
          </button>
          {profesorEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-base"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de Docentes Registrados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Docentes Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando profesores...</p>
        ) : profesores.length === 0 ? (
          <p className="text-slate-500 italic">No hay profesores registrados aún.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Docente</th>
                  <th className="p-3.5 border-b">Sede</th>
                  <th className="p-3.5 border-b">Contrato</th>
                  <th className="p-3.5 border-b">Tarifas (Clase / Admin)</th>
                  <th className="p-3.5 border-b">Materias Habilitadas</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {profesores.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-medium text-slate-900">
                      <div>{prof.nombre} {prof.apellido}</div>
                      <div className="text-xs text-slate-500">{prof.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{prof.sede || 'Ambato'}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                        {prof.tipo_contrato || 'Tiempo completo'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {prof.tipo_contrato === 'Por horas' ? (
                        <div className="text-xs space-y-0.5">
                          <span className="text-emerald-600 font-semibold block">Clase: ${prof.tarifa_hora_clase}/h</span>
                          <span className="text-blue-600 font-semibold block">Admin: ${prof.tarifa_hora_admin}/h</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">N/A (Sueldo Fijo)</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {prof.profesor_materia && prof.profesor_materia.length > 0 ? (
                          prof.profesor_materia.map((pm, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded border border-slate-200"
                            >
                              {pm.materias?.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Sin materias</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(prof)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-3 py-1 rounded font-medium transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(prof.id, `${prof.nombre} ${prof.apellido}`)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-xs px-3 py-1 rounded font-medium transition-colors"
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