'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  horas_max_semanales: number;
  tarifa_hora_clase: number;
  tarifa_hora_admin: number;
  profesor_materia?: { materias: { nombre: string } }[];
}

interface Materia {
  id: number;
  nombre: string;
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
];

export default function Home() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [materiasDB, setMateriasDB] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos del Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [tarifaClase, setTarifaClase] = useState<number | ''>('');
  const [tarifaAdmin, setTarifaAdmin] = useState<number | ''>('');
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);

  // Garantizar que las materias existan en la BD y cargar profesores
  const inicializarDatos = async () => {
    setLoading(true);

    // 1. Insertar materias fijas si no existen en la base de datos
    for (const matNombre of MATERIAS_DISPONIBLES) {
      const codigo = matNombre.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
      await supabase.from('materias').upsert(
        { nombre: matNombre, codigo },
        { onConflict: 'codigo', ignoreDuplicates: true }
      );
    }

    // 2. Traer la lista de materias registradas
    const { data: mData } = await supabase.from('materias').select('*');
    setMateriasDB(mData || []);

    // 3. Traer los profesores con sus materias asignadas
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

  // Manejar selección/deselección de materias
  const handleCheckboxChange = (materiaNombre: string) => {
    if (materiasSeleccionadas.includes(materiaNombre)) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter((m) => m !== materiaNombre));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materiaNombre]);
    }
  };

  // Guardar nuevo profesor con sus materias
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (materiasSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una materia que el profesor pueda dictar.');
      return;
    }

    // 1. Insertar el profesor
    const { data: nuevoProf, error: errorProf } = await supabase
      .from('profesores')
      .insert([
        {
          nombre,
          apellido,
          email,
          horas_max_semanales: 40,
          tarifa_hora_clase: Number(tarifaClase),
          tarifa_hora_admin: Number(tarifaAdmin),
        },
      ])
      .select()
      .single();

    if (errorProf) {
      alert('Error guardando profesor: ' + errorProf.message);
      return;
    }

    // 2. Asociar las materias seleccionadas en la tabla intermedia profesor_materia
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
      // Limpiar campos
      setNombre('');
      setApellido('');
      setEmail('');
      setTarifaClase('');
      setTarifaAdmin('');
      setMateriasSeleccionadas([]);
      inicializarDatos(); // Recargar tabla
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Profesores</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Registrar Nuevo Docente</h2>

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

        {/* Tarifas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Valor por Hora de Clase ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej. 12.50"
              value={tarifaClase}
              onChange={(e) => setTarifaClase(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Valor por Hora Administrativa ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej. 8.00"
              value={tarifaAdmin}
              onChange={(e) => setTarifaAdmin(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Selección de Materias */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Materias que puede impartir:
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

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Guardar Profesor
        </button>
      </form>

      {/* Tabla de Profesores Registrados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Docentes Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando profesores...</p>
        ) : profesores.length === 0 ? (
          <p className="text-slate-500 italic">No hay profesores registrados en el sistema.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Docente</th>
                  <th className="p-3.5 border-b">Email</th>
                  <th className="p-3.5 border-b">Tarifa Clase</th>
                  <th className="p-3.5 border-b">Tarifa Admin</th>
                  <th className="p-3.5 border-b">Materias Habilitadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {profesores.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-medium text-slate-900">
                      {prof.nombre} {prof.apellido}
                    </td>
                    <td className="p-3.5 text-slate-600">{prof.email}</td>
                    <td className="p-3.5 text-emerald-600 font-semibold">${prof.tarifa_hora_clase.toFixed(2)}/h</td>
                    <td className="p-3.5 text-blue-600 font-semibold">${prof.tarifa_hora_admin.toFixed(2)}/h</td>
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