'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface FechaApertura {
  id?: number;
  periodo_lectivo: string;
  apertura: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Feriado {
  id: number;
  nombre: string;
  fecha?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  es_intervalo?: boolean;
}

const APERTURAS_SIERRA = ['RS0', 'RS1', 'RS2', 'RS3', 'IS1', 'IS2', 'IS3', 'IS4'];
const APERTURAS_COSTA = ['RC0', 'RC1', 'RC2', 'RC3', 'IC1', 'IC2', 'IC3', 'IC4'];

export default function CalendarioFeriadosPage() {
  // Estados para Fechas de Apertura
  const [fechasApertura, setFechasApertura] = useState<FechaApertura[]>([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState('Ciclo Sierra');
  const [apertura, setApertura] = useState(APERTURAS_SIERRA[0]);
  const [fechaInicioApertura, setFechaInicioApertura] = useState('');
  const [fechaFinApertura, setFechaFinApertura] = useState('');

  // Estados para Feriados
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [nombreFeriado, setNombreFeriado] = useState('');
  const [tipoSeleccion, setTipoSeleccion] = useState<'dia' | 'intervalo'>('dia');
  const [fechaUnica, setFechaUnica] = useState('');
  const [fechaInicioFeriado, setFechaInicioFeriado] = useState('');
  const [fechaFinFeriado, setFechaFinFeriado] = useState('');
  const [loading, setLoading] = useState(true);

  const aperturasActuales = cicloSeleccionado === 'Ciclo Sierra' ? APERTURAS_SIERRA : APERTURAS_COSTA;

  const cargarDatos = async () => {
    setLoading(true);

    // Cargar Fechas de Apertura
    const { data: dataFechas, error: errorFechas } = await supabase.from('fechas_apertura').select('*');
    if (errorFechas) console.error('Error cargando fechas de apertura:', errorFechas);
    else setFechasApertura(dataFechas || []);

    // Cargar Feriados
    const { data: dataFeriados, error: errorFeriados } = await supabase
      .from('feriados')
      .select('*')
      .order('fecha_inicio', { ascending: true });
    if (errorFeriados) console.error('Error cargando feriados:', errorFeriados);
    else setFeriados(dataFeriados || []);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCicloChange = (nuevoCiclo: string) => {
    setCicloSeleccionado(nuevoCiclo);
    setApertura(nuevoCiclo === 'Ciclo Sierra' ? APERTURAS_SIERRA[0] : APERTURAS_COSTA[0]);
  };

  // Guardar Fechas por Apertura
  const handleGuardarFechaApertura = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicioApertura || !fechaFinApertura) {
      alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }

    const payload = {
      periodo_lectivo: cicloSeleccionado,
      apertura,
      fecha_inicio: fechaInicioApertura,
      fecha_fin: fechaFinApertura,
    };

    const { error } = await supabase
      .from('fechas_apertura')
      .upsert([payload], { onConflict: 'periodo_lectivo,apertura' });

    if (error) alert('Error guardando fecha de apertura: ' + error.message);
    else {
      alert(`Fechas para la apertura ${apertura} guardadas correctamente.`);
      cargarDatos();
    }
  };

  // Guardar Nuevo Feriado
  const handleGuardarFeriado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreFeriado) {
      alert('Por favor ingresa el nombre o motivo del feriado.');
      return;
    }

    let payload: any = {
      nombre: nombreFeriado,
    };

    if (tipoSeleccion === 'dia') {
      if (!fechaUnica) {
        alert('Por favor selecciona la fecha del feriado.');
        return;
      }
      payload.fecha = fechaUnica;
      payload.fecha_inicio = fechaUnica;
      payload.fecha_fin = fechaUnica;
    } else {
      if (!fechaInicioFeriado || !fechaFinFeriado) {
        alert('Por favor selecciona las fechas de inicio y fin del intervalo.');
        return;
      }
      if (fechaInicioFeriado > fechaFinFeriado) {
        alert('La fecha de inicio debe ser anterior o igual a la fecha de fin.');
        return;
      }
      payload.fecha = fechaInicioFeriado;
      payload.fecha_inicio = fechaInicioFeriado;
      payload.fecha_fin = fechaFinFeriado;
    }

    const { error } = await supabase.from('feriados').insert([payload]);

    if (error) alert('Error guardando el feriado: ' + error.message);
    else {
      alert('Feriado o intervalo no laborable registrado con éxito.');
      setNombreFeriado('');
      setFechaUnica('');
      setFechaInicioFeriado('');
      setFechaFinFeriado('');
      cargarDatos();
    }
  };

  // Eliminar Feriado
  const handleEliminarFeriado = async (id: number, nombre: string) => {
    if (!confirm(`¿Deseas eliminar el feriado "${nombre}"?`)) return;

    const { error } = await supabase.from('feriados').delete().eq('id', id);
    if (error) alert('Error eliminando feriado: ' + error.message);
    else cargarDatos();
  };

  const obtenerFechaExistente = (apert: string) => {
    return fechasApertura.find((f) => f.periodo_lectivo === cicloSeleccionado && f.apertura === apert);
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold text-slate-800">Calendario Académico y Feriados</h1>

      {/* SECCIÓN 1: Configuración de Fechas de Inicio y Fin por Apertura */}
      <section className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-6">
        <div className="border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">📅 Parametrización de Aperturas (Inicio y Fin)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configura el rango de vigencia para cada apertura por ciclo lectivo.
          </p>
        </div>

        {/* Selector de Ciclo */}
        <div className="flex space-x-3">
          {['Ciclo Sierra', 'Ciclo Costa'].map((ciclo) => (
            <button
              key={ciclo}
              type="button"
              onClick={() => handleCicloChange(ciclo)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                cicloSeleccionado === ciclo
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {ciclo}
            </button>
          ))}
        </div>

        {/* Formulario Asignación Directa */}
        <form onSubmit={handleGuardarFechaApertura} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Apertura ({cicloSeleccionado})</label>
              <select
                value={apertura}
                onChange={(e) => setApertura(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none"
              >
                {aperturasActuales.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Inicio *</label>
              <input
                type="date"
                required
                value={fechaInicioApertura}
                onChange={(e) => setFechaInicioApertura(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Fin *</label>
              <input
                type="date"
                required
                value={fechaFinApertura}
                onChange={(e) => setFechaFinApertura(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#0052B4] hover:bg-[#004098] text-white px-6 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow"
          >
            Guardar Fechas de Apertura
          </button>
        </form>

        {/* Resumen de Aperturas */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-slate-200">
            Resumen de Vigencia para {cicloSeleccionado}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {aperturasActuales.map((ap) => {
              const reg = obtenerFechaExistente(ap);
              return (
                <div key={ap} className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
                  <span className="bg-blue-900 text-blue-200 text-xs font-bold font-mono px-2 py-0.5 rounded">
                    {ap}
                  </span>
                  {reg ? (
                    <div className="text-[11px] text-slate-300 font-mono space-y-0.5 pt-1">
                      <div><strong className="text-emerald-400">Inicio:</strong> {reg.fecha_inicio}</div>
                      <div><strong className="text-rose-400">Fin:</strong> {reg.fecha_fin}</div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic pt-1">Sin fechas asignadas</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Registro y Gestión de Feriados (Día único o Intervalo) */}
      <section className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-5">
          <div className="border-b border-slate-700 pb-2">
            <h2 className="text-xl font-semibold">🏖️ Registro de Feriados y Periodos No Laborables</h2>
            <p className="text-xs text-slate-400 mt-1">
              Agrega días festivos puntuales o rangos de vacaciones/descansos obligatorios.
            </p>
          </div>

          <form onSubmit={handleGuardarFeriado} className="space-y-4">
            {/* Tipo de Registro (Puntual o Intervalo) */}
            <div className="flex items-center space-x-6 text-xs">
              <span className="font-semibold text-slate-300">Tipo de Selección:</span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoSeleccion"
                  value="dia"
                  checked={tipoSeleccion === 'dia'}
                  onChange={() => setTipoSeleccion('dia')}
                  className="accent-blue-500"
                />
                <span>Un solo día</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoSeleccion"
                  value="intervalo"
                  checked={tipoSeleccion === 'intervalo'}
                  onChange={() => setTipoSeleccion('intervalo')}
                  className="accent-blue-500"
                />
                <span>Intervalo (Fecha Inicio y Fecha Fin)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre o Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder={tipoSeleccion === 'dia' ? 'Ej. Batalla de Pichincha' : 'Ej. Vacaciones de Fin de Año'}
                  value={nombreFeriado}
                  onChange={(e) => setNombreFeriado(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none text-sm"
                />
              </div>

              {tipoSeleccion === 'dia' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha del Feriado *</label>
                  <input
                    type="date"
                    required
                    value={fechaUnica}
                    onChange={(e) => setFechaUnica(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none text-sm"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Inicio *</label>
                    <input
                      type="date"
                      required
                      value={fechaInicioFeriado}
                      onChange={(e) => setFechaInicioFeriado(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none text-sm"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Fin *</label>
                    <input
                      type="date"
                      required
                      value={fechaFinFeriado}
                      onChange={(e) => setFechaFinFeriado(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none text-sm"
                    />
                  </div>
                </>
              )}

              <div className={tipoSeleccion === 'intervalo' ? 'md:col-span-4 flex justify-end' : ''}>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow"
                >
                  + Registrar Feriado / Intervalo
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tabla de Feriados e Intervalos Registrados */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-800">Días y Periodos Festivos Registrados</h3>
          {loading ? (
            <p className="text-slate-500">Cargando feriados...</p>
          ) : feriados.length === 0 ? (
            <p className="text-slate-500 italic">No hay feriados registrados.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 text-sm">
                  <tr>
                    <th className="p-3.5 border-b">Tipo</th>
                    <th className="p-3.5 border-b">Fecha / Rango</th>
                    <th className="p-3.5 border-b">Nombre / Motivo</th>
                    <th className="p-3.5 border-b text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {feriados.map((f) => {
                    const esRango = f.fecha_inicio && f.fecha_fin && f.fecha_inicio !== f.fecha_fin;
                    const displayFecha = esRango
                      ? `${f.fecha_inicio}  ⟶  ${f.fecha_fin}`
                      : f.fecha_inicio || f.fecha;

                    return (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                              esRango
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {esRango ? 'Intervalo' : 'Día Único'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{displayFecha}</td>
                        <td className="p-3.5 text-slate-800 font-medium">{f.nombre}</td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarFeriado(f.id, f.nombre)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-xs px-2.5 py-1 rounded font-medium cursor-pointer"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}