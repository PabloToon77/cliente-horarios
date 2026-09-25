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

export default function CalendarioFeriadosPage() {
  // Estados para Fechas de Apertura / Ciclo
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

  const cargarDatos = async () => {
    setLoading(true);

    // Cargar Fechas de Apertura / Ciclo
    const { data: dataFechas, error: errorFechas } = await supabase.from('fechas_apertura').select('*');
    if (errorFechas) console.error('Error cargando fechas:', errorFechas);
    else {
      setFechasApertura(dataFechas || []);
      // Si el ciclo seleccionado es Costa, intentar precargar su fecha global
      const costaGlobal = (dataFechas || []).find((f) => f.periodo_lectivo === 'Ciclo Costa' && f.apertura === 'GLOBAL');
      if (costaGlobal && cicloSeleccionado === 'Ciclo Costa') {
        setFechaInicioApertura(costaGlobal.fecha_inicio || '');
        setFechaFinApertura(costaGlobal.fecha_fin || '');
      }
    }

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
    if (nuevoCiclo === 'Ciclo Sierra') {
      setApertura(APERTURAS_SIERRA[0]);
      const regSierra = fechasApertura.find((f) => f.periodo_lectivo === 'Ciclo Sierra' && f.apertura === APERTURAS_SIERRA[0]);
      setFechaInicioApertura(regSierra?.fecha_inicio || '');
      setFechaFinApertura(regSierra?.fecha_fin || '');
    } else {
      setApertura('GLOBAL');
      const regCosta = fechasApertura.find((f) => f.periodo_lectivo === 'Ciclo Costa' && f.apertura === 'GLOBAL');
      setFechaInicioApertura(regCosta?.fecha_inicio || '');
      setFechaFinApertura(regCosta?.fecha_fin || '');
    }
  };

  // Guardar Fechas por Apertura (Sierra) o Globales (Costa)
  const handleGuardarFechaApertura = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicioApertura || !fechaFinApertura) {
      alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }

    const aperturaValor = cicloSeleccionado === 'Ciclo Costa' ? 'GLOBAL' : apertura;

    const payload = {
      periodo_lectivo: cicloSeleccionado,
      apertura: aperturaValor,
      fecha_inicio: fechaInicioApertura,
      fecha_fin: fechaFinApertura,
    };

    const { error } = await supabase
      .from('fechas_apertura')
      .upsert([payload], { onConflict: 'periodo_lectivo,apertura' });

    if (error) alert('Error guardando fecha: ' + error.message);
    else {
      alert(
        cicloSeleccionado === 'Ciclo Costa'
          ? 'Fecha global del Ciclo Costa guardada con éxito para todos sus cursos.'
          : `Fechas para la apertura ${apertura} guardadas correctamente.`
      );
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

    let payload: any = { nombre: nombreFeriado };

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
      alert('Feriado o intervalo registrado con éxito.');
      setNombreFeriado('');
      setFechaUnica('');
      setFechaInicioFeriado('');
      setFechaFinFeriado('');
      cargarDatos();
    }
  };

  const handleEliminarFeriado = async (id: number, nombre: string) => {
    if (!confirm(`¿Deseas eliminar el feriado "${nombre}"?`)) return;

    const { error } = await supabase.from('feriados').delete().eq('id', id);
    if (error) alert('Error eliminando feriado: ' + error.message);
    else cargarDatos();
  };

  const fechaCostaGlobal = fechasApertura.find((f) => f.periodo_lectivo === 'Ciclo Costa' && f.apertura === 'GLOBAL');

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold text-slate-800">Calendario Académico y Feriados</h1>

      {/* SECCIÓN 1: Configuración de Fechas */}
      <section className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-6">
        <div className="border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">📅 Parametrización de Fechas por Ciclo Lectivo</h2>
          <p className="text-xs text-slate-400 mt-1">
            En el <strong>Ciclo Sierra</strong> puedes definir fechas por cada Apertura. En el <strong>Ciclo Costa</strong> se aplica una <strong>única fecha global</strong> para todos los cursos.
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

        {/* Formulario de Configuración */}
        <form onSubmit={handleGuardarFechaApertura} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cicloSeleccionado === 'Ciclo Sierra' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apertura (Sierra)</label>
                <select
                  value={apertura}
                  onChange={(e) => {
                    const apVal = e.target.value;
                    setApertura(apVal);
                    const reg = fechasApertura.find((f) => f.periodo_lectivo === 'Ciclo Sierra' && f.apertura === apVal);
                    setFechaInicioApertura(reg?.fecha_inicio || '');
                    setFechaFinApertura(reg?.fecha_fin || '');
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none"
                >
                  {APERTURAS_SIERRA.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-1">Configuración Costa</label>
                <input
                  type="text"
                  value="Fecha Única Global (Todos los Cursos)"
                  disabled
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-orange-300 font-semibold text-xs cursor-not-allowed"
                />
              </div>
            )}

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
            {cicloSeleccionado === 'Ciclo Costa' ? 'Guardar Fecha Global Ciclo Costa' : 'Guardar Fechas de Apertura'}
          </button>
        </form>

        {/* Resumen de Vigencia */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-slate-200">
            Resumen de Vigencia: {cicloSeleccionado}
          </h3>

          {cicloSeleccionado === 'Ciclo Sierra' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {APERTURAS_SIERRA.map((ap) => {
                const reg = fechasApertura.find((f) => f.periodo_lectivo === 'Ciclo Sierra' && f.apertura === ap);
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
          ) : (
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-md">
              <span className="bg-orange-900 text-orange-200 text-xs font-bold px-2.5 py-1 rounded">
                Ciclo Costa - Fecha Global Única
              </span>
              {fechaCostaGlobal ? (
                <div className="text-xs text-slate-300 font-mono space-y-1 pt-3">
                  <div><strong className="text-emerald-400">Fecha de Inicio:</strong> {fechaCostaGlobal.fecha_inicio}</div>
                  <div><strong className="text-rose-400">Fecha de Fin:</strong> {fechaCostaGlobal.fecha_fin}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-2">No se ha registrado la fecha global para el Ciclo Costa.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN 2: Registro de Feriados */}
      <section className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-5">
          <div className="border-b border-slate-700 pb-2">
            <h2 className="text-xl font-semibold">🏖️ Registro de Feriados y Periodos No Laborables</h2>
            <p className="text-xs text-slate-400 mt-1">
              Agrega días festivos puntuales o rangos de vacaciones/descansos obligatorios.
            </p>
          </div>

          <form onSubmit={handleGuardarFeriado} className="space-y-4">
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

                  <div>
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

        {/* Tabla de Feriados */}
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