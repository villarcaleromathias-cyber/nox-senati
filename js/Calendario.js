window.CalendarioSection = function CalendarioSection() {
  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Calendario General</h2>
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <span className="text-blue-400">🔵 Clases</span>
        <span className="text-red-400">🔴 Exámenes</span>
        <span className="text-purple-400">🟣 Parciales</span>
        <span className="text-yellow-400">🟡 Eventos</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {['L','M','X','J','V','S','D'].map(d=><div key={d} className="font-bold text-xs text-zinc-500 py-1">{d}</div>)}
        {Array.from({length: 31}).map((_, i) => (
          <div key={i} className="p-1.5 sm:p-2 aspect-square rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center relative">
            <span className="text-xs sm:text-sm">{i + 1}</span>
            {i === 10 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5"></div>}
            {i === 15 && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};
