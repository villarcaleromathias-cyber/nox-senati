const { useState } = React;

window.ExamenesSection = function ExamenesSection({ items = [], onAddItem }) {
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

  const currentExamenes = items.filter(item => {
    const itemDate = new Date(item.date);
    return item.type === 'examen' && itemDate.getFullYear() === year && itemDate.getMonth() === month;
  });

  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Exámenes y Eventos</h2>
          {isCurrentMonth && (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Mes Actual
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition">←</button>
          <span className="font-bold capitalize text-sm sm:text-base px-2">{monthName} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition">→</button>
        </div>
      </div>

      {currentExamenes.length === 0 ? (
        <div className="p-6 sm:p-8 text-center text-zinc-500 bg-zinc-950 rounded-2xl border border-zinc-900">
          <p className="text-sm">No hay exámenes ni eventos registrados para este mes.</p>
          <button 
            onClick={() => onAddItem({ type: 'examen', title: 'Nuevo Examen SENATI', date: new Date(year, month, 15).toISOString().split('T')[0] })}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold active:scale-95 transition"
          >
            + Añadir Nuevo Examen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentExamenes.map((ex, i) => (
            <div key={i} className="p-4 rounded-2xl bg-zinc-950 border border-red-900/40 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-red-400">{ex.title}</h4>
                <p className="text-xs text-zinc-400">📅 Fecha: {ex.date}</p>
              </div>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">Examen</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
