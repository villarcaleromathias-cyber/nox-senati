window.CursosSection = function CursosSection() {
  return (
    <div className="card-nox p-6 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Cursos (Materiales)</h2>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold">+ Añadir Curso</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
          <h3 className="font-bold text-lg mb-2">Ingeniería de Software</h3>
          <p className="text-xs text-zinc-500 mb-4">Sube aquí tus PDFs. Se vincularán a tu Google Drive.</p>
          <div className="space-y-2">
            <button className="w-full p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-left flex justify-between">
              📄 Clase_1_Introduccion.pdf <span>☁️ Drive</span>
            </button>
            <button className="w-full p-2 border border-dashed border-zinc-700 text-zinc-400 rounded-lg text-sm">+ Subir Archivo a Drive</button>
          </div>
        </div>
      </div>
    </div>
  );
};
