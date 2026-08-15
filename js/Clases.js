const { useState } = React;

window.ClasesSection = function ClasesSection({ items = [], onAddItem }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth); setYear(newYear);
  };

  const monthName = new Date(year, month).toLocaleString('es-ES', { month: 'long' });
  const semanas = [1, 2, 3, 4].map(num => `Semana ${num} - ${monthName} ${year}`);
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-nox p-4 sm:p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold capitalize">Clases de {monthName} {year}</h2>
          {isCurrentMonth && (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Mes Actual
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition font-bold text-xs sm:text-sm">← Anterior</button>
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-purple-300">Hoy</button>
          <button onClick={() => changeMonth(1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition font-bold text-xs sm:text-sm">Siguiente →</button>
        </div>
      </div>

      {semanas.map((semanaNom, semIdx) => (
        <div key={semIdx} className="card-nox p-4 sm:p-5 rounded-3xl">
          <h3 className="font-bold text-base sm:text-lg mb-4 text-purple-400 capitalize">{semanaNom}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {dias.map(dia => (
              <div key={dia} className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-900 min-h-[110px] flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400">{dia}</span>
                <button 
                  onClick={() => onAddItem({ type: 'clase', title: `Clase ${dia}`, date: new Date(year, month, (semIdx * 7) + 1).toISOString().split('T')[0] })}
                  className="w-full mt-2 py-1.5 text-[10px] bg-zinc-900 hover:bg-purple-900/40 hover:text-purple-300 rounded-lg text-zinc-400 active:scale-95 transition"
                >
                  + Añadir Clase
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
