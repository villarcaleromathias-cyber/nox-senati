const { useState } = React;

window.EntregablesSection = function EntregablesSection({ items = [], onAddItem }) {
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

  const currentEntregables = items.filter(item => item.type === 'entregable');

  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Entregables SENATI ({monthName} {year})</h2>
          {isCurrentMonth && (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Mes Actual
            </span>
          )}
        </div>

        <button 
          onClick={() => onAddItem({ type: 'entregable', title: 'Nuevo Trabajo Entregable', date: new Date(year, month, 20).toISOString().split('T')[0] })}
          className="w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold text-sm active:scale-95 transition"
        >
          + Nuevo Trabajo
        </button>
      </div>

      <div className="space-y-4">
        {currentEntregables.map((item, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="font-bold text-base sm:text-lg">{item.title}</h4>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">⏳ Plazo máximo: {item.date}</p>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">En Progreso</span>
          </div>
        ))}
      </div>
    </div>
  );
};
