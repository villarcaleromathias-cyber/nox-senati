const { useState } = React;
window.ExamenesSection = function ExamenesSection() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth); setYear(newYear);
  };

  const monthName = new Date(year, month).toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Exámenes y Eventos</h2>
        <div className="flex gap-3 items-center">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition">←</button>
          <span className="font-bold capitalize text-sm sm:text-base">{monthName} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl active:scale-95 transition">→</button>
        </div>
      </div>
      <div className="p-6 sm:p-8 text-center text-zinc-500 bg-zinc-950 rounded-2xl border border-zinc-900">
        <p className="text-sm">No hay exámenes ni eventos registrados para este mes.</p>
        <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold active:scale-95 transition">+ Añadir Nuevo</button>
      </div>
    </div>
  );
};
