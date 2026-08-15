window.ClasesSection = function ClasesSection() {
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
  const semanas = [1, 2, 3, 4].map(num => `Semana ${num} - ${currentMonthName}`);
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Organización de Clases</h2>
      {semanas.map((semanaNom, semIdx) => (
        <div key={semIdx} className="card-nox p-4 sm:p-5 rounded-3xl">
          <h3 className="font-bold text-base sm:text-lg mb-4 text-purple-400 capitalize">{semanaNom}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {dias.map(dia => (
              <div key={dia} className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-900 min-h-[100px] flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-500">{dia}</span>
                <button className="w-full mt-2 py-1.5 text-[10px] bg-zinc-900 rounded-lg hover:bg-zinc-800 text-zinc-400 active:scale-95 transition">+ Añadir</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
