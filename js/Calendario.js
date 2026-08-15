const { useState } = React;

window.CalendarioSection = function CalendarioSection({ items = [], onAddItem }) {
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0

  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold capitalize">{monthName} {year}</h2>
          {isCurrentMonth && (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Mes Actual
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition font-bold">← Anterior</button>
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-purple-300">Hoy</button>
          <button onClick={() => changeMonth(1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition font-bold">Siguiente →</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 text-xs bg-zinc-950 p-3 rounded-2xl border border-zinc-900">
        <span className="flex items-center gap-1 text-blue-400 font-semibold"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> 🔵 Clases</span>
        <span className="flex items-center gap-1 text-red-400 font-semibold"><span className="w-2.5 h-2.5 rounded bg-red-500"></span> 🔴 Exámenes</span>
        <span className="flex items-center gap-1 text-purple-400 font-semibold"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> 🟣 Parciales</span>
        <span className="flex items-center gap-1 text-yellow-400 font-semibold"><span className="w-2.5 h-2.5 rounded bg-yellow-500"></span> 🟡 Entregables</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div key={d} className="font-bold text-xs text-zinc-500 py-1">{d}</div>)}
        
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2 rounded-2xl bg-zinc-950/30 opacity-20"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isToday = isCurrentMonth && now.getDate() === dayNum;
          
          // Filtrar items para este día del mes activo
          const dayItems = items.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === year && itemDate.getMonth() === month && itemDate.getDate() === dayNum;
          });

          return (
            <div 
              key={dayNum} 
              className={`min-h-[85px] sm:min-h-[105px] p-1.5 rounded-2xl border flex flex-col justify-start text-left transition ${
                isToday ? 'bg-purple-950/20 border-purple-500' : 'bg-zinc-950 border-zinc-900'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isToday ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
                  {dayNum}
                </span>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[70px]">
                {dayItems.map((item, idx) => {
                  let badgeBg = 'bg-blue-900/60 text-blue-200 border-blue-500/40';
                  if (item.type === 'examen') badgeBg = 'bg-red-900/60 text-red-200 border-red-500/40';
                  if (item.type === 'parcial') badgeBg = 'bg-purple-900/60 text-purple-200 border-purple-500/40';
                  if (item.type === 'entregable') badgeBg = 'bg-yellow-900/60 text-yellow-200 border-yellow-500/40';

                  return (
                    <div key={idx} className={`text-[10px] p-1 rounded-lg border ${badgeBg} truncate font-semibold`} title={item.title}>
                      {item.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
