window.CursosSection = function CursosSection() {
  return (
    <div className="card-nox p-4 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Mis Cursos (Materiales)</h2>
        <button className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm active:scale-95 transition">+ Añadir Curso</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <h3 className="font-bold text-base sm:text-lg mb-1">Ingeniería de Software AI</h3>
          <p className="text-xs text-zinc-500 mb-4">Sube tus PDFs. Se sincronizan directamente con Google Drive.</p>
          <div className="space-y-2">
            <button className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs sm:text-sm text-left flex justify-between items-center transition">
              <span className="truncate pr-2">📄 Clase_1_Introduccion.pdf</span> 
              <span className="shrink-0 text-xs text-blue-400">☁️ Drive</span>
            </button>
            <button className="w-full p-2.5 border border-dashed border-zinc-700 hover:border-purple-500 text-zinc-400 rounded-xl text-xs sm:text-sm transition text-center">
              + Subir Archivo a Drive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
