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

const APERTURAS_SIERRA = ['RS0', 'RS1', 'RS2', 'RS3', 'IS1', 'IS2', 'IS3', 'IS4'];
const APERTURAS_COSTA = ['RC0', 'RC1', 'RC2', 'RC3', 'IC1', 'IC2', 'IC3', 'IC4'];

export default function CalendarioFeriadosPage() {
  const [fechas, setFechas] = useState<FechaApertura[]>([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState('Ciclo Sierra');
  const [loading, setLoading] = useState(true);

  // Formulario rápido
  const [apertura, setApertura] = useState(APERTURAS_SIERRA[0]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const aperturasActuales = cicloSeleccionado === 'Ciclo Sierra' ? APERTURAS_SIERRA : APERTURAS_COSTA;

  const cargarFechas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fechas_apertura').select('*');
    if (error) console.error('Error cargando fechas:', error);
    else setFechas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarFechas();
  }, []);

  const handleCicloChange = (nuevoCiclo: string) => {
    setCicloSeleccionado(nuevoCiclo);
    setApertura(nuevoCiclo === 'Ciclo Sierra' ? APERTURAS_SIERRA[0] : APERTURAS_COSTA[0]);
  };

  const handleGuardarFecha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }

    const payload = {
      periodo_lectivo: cicloSeleccionado,
      apertura,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    const { error } = await supabase
      .from('fechas_apertura')
      .upsert([payload], { onConflict: 'periodo_lectivo,apertura' });

    if (error) alert('Error guardando fecha de apertura: ' + error.message);
    else {
      alert(`Fechas para la apertura ${apertura} guardadas correctamente.`);
      cargarFechas();
    }
  };

  const obtenerFechaExistente = (apert: string) => {
    return fechas.find((f) => f.periodo_lectivo === cicloSeleccionado && f.apertura === apert);
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Calendario y Parametrización de Aperturas</h1>

      {/* Configuración de Fechas de Inicio y Fin por Apertura */}
      <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg space-y-6">
        <div className="border-b border-slate-700 pb-2">
          <h2 className="text-xl font-semibold">📅 Asignación de Fechas de Inicio y Fin por Apertura</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configura el rango de vigencia para cada apertura. Estas fechas influirán en la planificación académica.
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
        <form onSubmit={handleGuardarFecha} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
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
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Fin *</label>
              <input
                type="date"
                required
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
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

        {/* Resumen de Aperturas del Ciclo Seleccionado */}
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
      </div>
    </main>
  );
}