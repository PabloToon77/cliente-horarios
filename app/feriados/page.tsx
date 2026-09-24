'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Feriado {
  id: number;
  fecha: string;
  descripcion: string;
  tipo: string;
  sede: string;
}

const SEDES = [
  'Todas',
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

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [feriadoEditandoId, setFeriadoEditandoId] = useState<number | null>(null);

  // Modo de Selección: 'unico' o 'rango'
  const [modoFecha, setModoFecha] = useState<'unico' | 'rango'>('unico');

  // Formulario
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Nacional');
  const [sede, setSede] = useState('Todas');

  const cargarFeriados = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('feriados').select('*').order('fecha', { ascending: true });
    if (error) console.error('Error cargando feriados:', error);
    else setFeriados(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarFeriados();
  }, []);

  const limpiarFormulario = () => {
    setFeriadoEditandoId(null);
    setModoFecha('unico');
    setFechaInicio('');
    setFechaFin('');
    setDescripcion('');
    setTipo('Nacional');
    setSede('Todas');
  };

  const handleEditar = (f: Feriado) => {
    setFeriadoEditandoId(f.id);
    setModoFecha('unico');
    setFechaInicio(f.fecha);
    setFechaFin('');
    setDescripcion(f.descripcion);
    setTipo(f.tipo);
    setSede(f.sede);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number, desc: string) => {
    if (!confirm(`¿Eliminar el feriado "${desc}"?`)) return;
    const { error } = await supabase.from('feriados').delete().eq('id', id);
    if (error) alert('Error eliminando feriado: ' + error.message);
    else cargarFeriados();
  };

  // Función para generar array de fechas en un rango YYYY-MM-DD
  const generarRangoFechas = (inicio: string, fin: string) => {
    const listaFechas: string[] = [];
    let fechaActual = new Date(inicio + 'T00:00:00');
    const fechaLimite = new Date(fin + 'T00:00:00');

    while (fechaActual <= fechaLimite) {
      listaFechas.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return listaFechas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (feriadoEditandoId) {
      // Edición de un registro específico
      const { error } = await supabase
        .from('feriados')
        .update({ fecha: fechaInicio, descripcion, tipo, sede })
        .eq('id', feriadoEditandoId);

      if (error) alert('Error actualizando feriado: ' + error.message);
      else {
        alert('Feriado actualizado con éxito.');
        limpiarFormulario();
        cargarFeriados();
      }
    } else {
      // Inserción (Día único o Intervalo)
      if (modoFecha === 'rango') {
        if (!fechaInicio || !fechaFin) {
          alert('Por favor selecciona la fecha de inicio y fin.');
          return;
        }

        if (fechaInicio > fechaFin) {
          alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
          return;
        }

        const fechasGeneradas = generarRangoFechas(fechaInicio, fechaFin);
        const registrosInsertar = fechasGeneradas.map((f) => ({
          fecha: f,
          descripcion,
          tipo,
          sede: tipo === 'Nacional' ? 'Todas' : sede,
        }));

        const { error } = await supabase.from('feriados').insert(registrosInsertar);

        if (error) alert('Error guardando rango de feriados: ' + error.message);
        else {
          alert(`¡Se registraron ${registrosInsertar.length} días de feriado correctamente!`);
          limpiarFormulario();
          cargarFeriados();
        }
      } else {
        // Día Único
        const { error } = await supabase.from('feriados').insert([
          {
            fecha: fechaInicio,
            descripcion,
            tipo,
            sede: tipo === 'Nacional' ? 'Todas' : sede,
          },
        ]);

        if (error) alert('Error guardando feriado: ' + error.message);
        else {
          alert('Feriado guardado con éxito.');
          limpiarFormulario();
          cargarFeriados();
        }
      }
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Calendario Académico y Feriados</h1>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl space-y-6 text-white shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">
            {feriadoEditandoId ? '✏️ Editar Feriado / Suspensión' : 'Registrar Feriado / Día No Laborable'}
          </h2>
          {feriadoEditandoId && (
            <button type="button" onClick={limpiarFormulario} className="text-xs text-slate-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </div>

        {/* Selector de Modo de Fecha (Oculto en modo edición) */}
        {!feriadoEditandoId && (
          <div className="flex items-center space-x-6 text-sm bg-slate-800 p-3 rounded-lg border border-slate-700 w-fit">
            <span className="text-xs text-slate-400 font-medium">Modo de Selección:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="modoFecha"
                value="unico"
                checked={modoFecha === 'unico'}
                onChange={() => setModoFecha('unico')}
                className="text-blue-500 focus:ring-0"
              />
              <span>Día Único</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="modoFecha"
                value="rango"
                checked={modoFecha === 'rango'}
                onChange={() => setModoFecha('rango')}
                className="text-blue-500 focus:ring-0"
              />
              <span className="text-emerald-400 font-semibold">📅 Intervalo / Rango de Días</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {modoFecha === 'unico' || feriadoEditandoId ? (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fecha</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha de Fin (Inclusive)</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className={modoFecha === 'rango' && !feriadoEditandoId ? 'md:col-span-2' : 'md:col-span-2'}>
            <label className="block text-xs text-slate-400 mb-1">Descripción / Motivo</label>
            <input
              type="text"
              placeholder="Ej. Vacaciones de Fin de Año / Carnaval"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo de Feriado</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Nacional">Nacional (Todas las sedes)</option>
              <option value="Local">Local (Especificar Sede)</option>
            </select>
          </div>

          {tipo === 'Local' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sede Afectada</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                {SEDES.filter((s) => s !== 'Todas').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
          >
            {feriadoEditandoId
              ? 'Actualizar Feriado'
              : modoFecha === 'rango'
              ? 'Guardar Rango de Feriados'
              : 'Guardar Feriado'}
          </button>
        </div>
      </form>

      {/* Lista de Feriados Registrados */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Días No Laborables Registrados</h2>
        {loading ? (
          <p className="text-slate-500">Cargando calendarios...</p>
        ) : feriados.length === 0 ? (
          <p className="text-slate-500 italic">No hay feriados o suspensiones registradas.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="p-3.5 border-b">Fecha</th>
                  <th className="p-3.5 border-b">Descripción</th>
                  <th className="p-3.5 border-b">Tipo</th>
                  <th className="p-3.5 border-b">Sede</th>
                  <th className="p-3.5 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {feriados.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-medium text-slate-900">{f.fecha}</td>
                    <td className="p-3.5 text-slate-800 font-medium">{f.descripcion}</td>
                    <td className="p-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        f.tipo === 'Nacional' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {f.tipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{f.tipo === 'Nacional' ? 'Todas' : f.sede}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditar(f)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(f.id, f.descripcion)}
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