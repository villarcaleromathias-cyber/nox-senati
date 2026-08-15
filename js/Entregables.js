window.EntregablesSection = function EntregablesSection() {
  return (
    <div className="card-nox p-6 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Entregables</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">+ Nuevo Trabajo</button>
      </div>
      <div className="space-y-4">
        {/* Ejemplo de Entregable */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-lg">Proyecto de Software (Ejemplo)</h4>
            <p className="text-sm text-zinc-400 mt-1">📅 Inicio: 01/03/2026 • ⏳ Plazo máximo: 15/03/2026</p>
          </div>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">En Progreso</span>
        </div>
      </div>
    </div>
  );
};
