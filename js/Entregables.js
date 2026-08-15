window.EntregablesSection = function EntregablesSection() {
  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Entregables</h2>
        <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm active:scale-95 transition">+ Nuevo Trabajo</button>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="font-bold text-base sm:text-lg">Proyecto de Software SENATI</h4>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">📅 Inicio: 01/03/2026 • ⏳ Plazo: 15/03/2026</p>
          </div>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">En Progreso</span>
        </div>
      </div>
    </div>
  );
};
