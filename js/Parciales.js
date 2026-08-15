window.ParcialesSection = function ParcialesSection() {
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
  const semanas = [1, 2, 3, 4].map(num => `Semana ${num} - Parciales (${currentMonthName})`);
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Calendario de Parciales</h2>
      {semanas.map((semanaNom, semIdx) => (
        <div key={semIdx} className="card-nox p-5 rounded-3xl border-purple-900/30">
          <h3 className="font-bold text-lg mb-4 text-red-400 capitalize">{semanaNom}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            {dias.map(dia => (
              <div key={dia} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-900 min-h-[120px]">
                <span className="text-sm font-bold text-red-500/70">{dia}</span>
                <button className="w-full mt-2 py-1 text-[10px] bg-red-950/30 text-red-400 rounded hover:bg-red-900/50">+ Eval.</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
