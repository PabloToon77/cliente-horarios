'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Temario {
  id: number;
  universidad: string;
  materia: string;
  codigo: string;
  tema_especifico: string;
  numero_clase: number;
}

const UNIVERSIDADES = [
  'UTA',
  'ESPE',
  'UNACH',
  'UTC',
  'ESPOCH',
  'UCE',
  'EPN',
  'UNL',
  'UCUENCA',
  'General / Multiversidad',
];

const MATERIAS_OFICIALES = [
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

export default function TemariosPage() {
  const [temarios, setTemarios] = useState<Temario[]>([]);
  const [loading, setLoading] = useState(true);
  const [temarioEditandoId, setTemarioEditandoId] = useState<number | null>(null);

  // Campos del Formulario
  const [universidad, setUniversidad] = useState(UNIVERSIDADES[0]);
  const [materia, setMateria] = useState(MATERIAS_OFICIALES[0]);
  const [codigo, setCodigo] = useState('');
  const [temaEspecifico, setTemaEspecifico] = useState('');
  const [numeroClase, setNumeroClase] = useState<number | ''>(1);

  // Filtros de búsqueda en la lista
  const [filtroUniversidad, setFiltroUniversidad] = useState('Todas');
  const [filtroMateria, setFiltroMateria] = useState('Todas');

  const cargarTemarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('temarios')
      .select('*')
      .order('universidad')
      .order('materia')
      .order('numero_clase');

    if (error) console.error('Error cargando temarios:', error);
    else setTemarios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarTemarios();
  }, []);

  const limpiarFormulario = () => {
    setTemarioEditandoId(null);
    setUniversidad(UNIVERSIDADES[0]);
    setMateria(MATERIAS_OFICIALES[0]);
    setCodigo('');
    setTemaEspecifico('');
    setNumeroClase(1);
  };

  const handleEditar = (t: Temario) => {
    setTemarioEditandoId(t.id);
    setUniversidad(t.universidad);
    setMateria(t.materia);
    setCodigo(t.codigo);
    setTemaEspecifico(t.tema_especifico);
    setNumeroClase(t.numero_clase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number, tema: string) => {
    if (!confirm(`¿Eliminar el tema "${tema}"?`)) return;

    const { error } = await supabase.from('temarios').delete().eq('id', id);
    if (error) alert('Error eliminando temario: ' + error.message);
    else {
      if (temarioEditandoId === id) limpiarFormulario();
      cargarTemarios();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const datosTemario = {
      universidad,
      materia,
      codigo,
      tema_especifico: temaEspecifico,
      numero_clase: Number(numeroClase) || 1,
    };

    if (temarioEditandoId) {
      const { error } = await supabase.from('temarios').update(datosTemario).eq('id', temarioEditandoId);
      if (error) alert('Error actualizando temario: ' + error.message);
      else {
        alert('Tema actualizado con éxito.');
        limpiarFormulario();
        cargarTemarios();
      }
    } else {
      const { error } = await supabase.from('temarios').insert([datosTemario]);
      if (error) alert('Error registrando temario: ' + error.message);
      else {
        alert('Tema registrado con éxito.');
        limpiarFormulario();
        cargarTemarios();
      }
    }
  };

  // Temarios filtrados para la vista
  const temariosFiltrados = temarios.filter((t) => {
    const cumpleUni = filtroUniversidad === 'Todas' || t.universidad === filtroUniversidad;
    const cumpleMat = filtroMateria === 'Todas' || t.materia === filtroMateria;
    return cumpleUni && cumpleMat;
  });

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Gestión de Temarios por Universidad</h1>

      {/* Formulario de Registro */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {temarioEditandoId ? '✏️ Editar Tema de Sílabo' : 'Registrar Nuevo Tema de Sílabo'}
          </h2>
          {temarioEditandoId && (
            <button type="button" onClick={limpiarFormulario} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
              Cancelar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1">Universidad *</label>
            <select
              value={universidad}
              onChange={(e) => setUniversidad(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {UNIVERSIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-400 mb-1">Materia Docente *</label>
            <select
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {MATERIAS_OFICIALES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Número de Clase</label>
            <input
              type="number"
              min="1"
              required
              value={numeroClase}
              onChange={(e) => setNumeroClase(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Código del Tema / Identificador</label>
            <input
              type="text"
              required
              placeholder="Ej. MAT-01 / MEC-02"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Tema Específico / Contenido</label>
            <input
              type="text"
              required
              placeholder="Ej. Ecuaciones cuadráticas y factorización avanzada"
              value={temaEspecifico}
              onChange={(e) => setTemaEspecifico(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#0052B4] hover:bg-[#004098] text-white px-8 py-2.5 rounded-lg font-bold transition-colors shadow-md cursor-pointer text-sm"
          >
            {temarioEditandoId ? 'Actualizar Tema' : 'Guardar Tema'}
          </button>
        </div>
      </form>

      {/* Filtros y Lista de Temarios */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-semibold text-slate-800">Temarios Registrados</h2>

          {/* Filtros de Búsqueda */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">Universidad:</span>
              <select
                value={filtroUniversidad}
                onChange={(e) => setFiltroUniversidad(e.target.value)}
                className="p-1.5 rounded bg-slate-100 border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none"
              >
                <option value="Todas">Todas</option>
                {UNIVERSIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">Materia:</span>
              <select
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                className="p-1.5 rounded bg-slate-100 border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none"
              >
                <option value="Todas">Todas</option>
                {MATERIAS_OFICIALES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando temarios...</p>
        ) : temariosFiltrados.length === 0 ? (
          <p className="text-slate-500 italic">No hay temas registrados para el filtro seleccionado.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Univ.</th>
                  <th className="p-3.5 border-b">Materia Docente</th>
                  <th className="p-3.5 border-b">Clase #</th>
                  <th className="p-3.5 border-b">Código</th>
                  <th className="p-3.5 border-b">Tema Específico</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {temariosFiltrados.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold px-2 py-0.5 rounded">
                        {t.universidad}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-800 font-medium">
                      {t.materia}
                    </td>
                    <td className="p-3.5 font-mono text-center font-bold text-slate-700">
                      {t.numero_clase}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#0052B4]">
                      {t.codigo}
                    </td>
                    <td className="p-3.5 text-slate-800">
                      {t.tema_especifico}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(t)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded font-medium cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(t.id, t.tema_especifico)}
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