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
  color_hex?: string;
  disponibilidad_json?: Record<string, string[]>;
  profesor_materia?: { materias: { nombre: string } }[];
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
  'Salcedo',
  'Pujilí',
  'Píllaro',
  'Baños',
  'Coca',
  'Alausí',
  'Bucay',
  'Tena',
];

// Se agrega "OV" al listado oficial de materias
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

const PALETA_COLORES = [
  { nombre: 'Azul', hex: '#2563eb' },
  { nombre: 'Verde Esmeralda', hex: '#059669' },
  { nombre: 'Naranja Brand', hex: '#ff6b35' },
  { nombre: 'Púrpura', hex: '#7c3aed' },
  { nombre: 'Rosa', hex: '#db2777' },
  { nombre: 'Rojo', hex: '#dc2626' },
  { nombre: 'Cian', hex: '#0891b2' },
  { nombre: 'Ámbar', hex: '#d97706' },
  { nombre: 'Índigo', hex: '#4f46e5' },
  { nombre: 'Gris Oscuro', hex: '#475569' },
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

  // Campos principales del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState<string[]>(['Ambato']);
  const [tipoContrato, setTipoContrato] = useState('Tiempo completo (40h)');
  const [tarifaClase, setTarifaClase] = useState<number | ''>('');
  const [tarifaAdmin, setTarifaAdmin] = useState<number | ''>('');
  const [colorHex, setColorHex] = useState(PALETA_COLORES[0].hex);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);

  // Estado para la Matriz de Disponibilidad
  const [disponibilidad, setDisponibilidad] = useState<Record<string, string[]>>({});

  // Cargar datos al iniciar
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
        materias ( nombre )
      )
    `);

    if (error) console.error('Error cargando profesores:', error);
    else setProfesores(pData || []);

    setLoading(false);
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

  const handleSedeChange = (sedeNombre: string) => {
    if (sedesSeleccionadas.includes(sedeNombre)) {
      setSedesSeleccionadas(sedesSeleccionadas.filter((s) => s !== sedeNombre));
    } else {
      setSedesSeleccionadas([...sedesSeleccionadas, sedeNombre]);
    }
  };

  const handleCheckboxChange = (materiaNombre: string) => {
    if (materiasSeleccionadas.includes(materiaNombre)) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter((m) => m !== materiaNombre));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materiaNombre]);
    }
  };

  // Conmutador de bloque individual
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

  // Conmutador de DÍA COMPLETO
  const toggleDiaCompleto = (dia: string) => {
    const horasDia = disponibilidad[dia] || [];
    const estaTodoCompleto = BLOQUES_HORARIOS.every((bloque) => horasDia.includes(bloque));

    setDisponibilidad({
      ...disponibilidad,
      [dia]: estaTodoCompleto ? [] : [...BLOQUES_HORARIOS],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sedesSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una sede para el profesor.');
      return;
    }

    if (materiasSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una materia que el profesor pueda impartir.');
      return;
    }

    let horasMax = 40;
    if (tipoContrato === 'Medio tiempo (20h)') horasMax = 20;
    if (tipoContrato === 'Por horas') horasMax = 0;

    const tarifaClaseVal = tipoContrato === 'Por horas' ? Number(tarifaClase) || 0 : 0;
    const tarifaAdminVal = tipoContrato === 'Por horas' ? Number(tarifaAdmin) || 0 : 0;

    const sedesString = sedesSeleccionadas.join(', ');

    const { data: nuevoProf, error: errorProf } = await supabase
      .from('profesores')
      .insert([
        {
          nombre,
          apellido,
          email,
          sede: sedesString,
          tipo_contrato: tipoContrato,
          horas_max_semanales: horasMax,
          tarifa_hora_clase: tarifaClaseVal,
          tarifa_hora_admin: tarifaAdminVal,
          color_hex: colorHex,
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
      setNombre('');
      setApellido('');
      setEmail('');
      setSedesSeleccionadas(['Ambato']);
      setTipoContrato('Tiempo completo (40h)');
      setTarifaClase('');
      setTarifaAdmin('');
      setColorHex(PALETA_COLORES[0].hex);
      setMateriasSeleccionadas([]);
      setDisponibilidad({});
      inicializarDatos();
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Docentes</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Registrar Nuevo Profesor</h2>

        {/* Datos Personales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Color Representativo del Docente */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            🎨 Color Identificador para el Horario:
          </label>
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/50 p-3.5 rounded-lg border border-slate-700">
            {PALETA_COLORES.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColorHex(c.hex)}
                className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                  colorHex === c.hex ? 'scale-110 border-white ring-2 ring-blue-400' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.nombre}
              />
            ))}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-xs text-slate-400">Personalizado:</span>
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Selección Múltiple de Sedes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Sedes Habilitadas para Laborar:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            {SEDES.map((s) => (
              <label key={s} className="flex items-center space-x-2 text-sm cursor-pointer hover:text-blue-400">
                <input
                  type="checkbox"
                  checked={sedesSeleccionadas.includes(s)}
                  onChange={() => handleSedeChange(s)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
                />
                <span>{s}</span>
              </label>
            ))}
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
                <span className={materia === 'OV' ? 'font-bold text-orange-400' : ''}>{materia}</span>
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

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-base shadow-md cursor-pointer"
        >
          Guardar Profesor
        </button>
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
                  <th className="p-3.5 border-b">Color</th>
                  <th className="p-3.5 border-b">Sedes</th>
                  <th className="p-3.5 border-b">Contrato</th>
                  <th className="p-3.5 border-b">Tarifas (Clase / Admin)</th>
                  <th className="p-3.5 border-b">Materias Habilitadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {profesores.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-medium text-slate-900">
                      <div>{prof.nombre} {prof.apellido}</div>
                      <div className="text-xs text-slate-500">{prof.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-sm"
                        style={{ backgroundColor: prof.color_hex || '#2563eb' }}
                        title={`Color: ${prof.color_hex || '#2563eb'}`}
                      />
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {prof.sede || 'Ambato'}
                    </td>
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
                              className={`text-xs px-2 py-0.5 rounded border ${
                                pm.materias?.nombre === 'OV'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {pm.materias?.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Sin materias</span>
                        )}
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