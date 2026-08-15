const { useState } = React;
window.AuroraSphere = function AuroraSphere() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="aurora-sphere" onClick={() => setOpen(!open)}>
        ✨
      </div>
      
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-zinc-950 border border-purple-500/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-purple-900 to-blue-900 flex justify-between items-center">
            <h3 className="font-bold text-white">Aurora IA</h3>
            <button onClick={() => setOpen(false)} className="text-white font-bold">×</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none w-11/12 text-zinc-200">
              Hola, soy Aurora. Puedo leer tu calendario, analizar PDFs de tus cursos y leer tus correos estudiantiles de Outlook. ¿Qué necesitas?
            </div>
          </div>
          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <button className="p-2 bg-zinc-800 rounded-xl" title="Subir foto/PDF">📎</button>
            <input type="text" placeholder="Pídele algo a Aurora..." className="flex-1 bg-zinc-900 rounded-xl px-3 text-sm outline-none" />
            <button className="p-2 bg-purple-600 rounded-xl">➤</button>
          </div>
        </div>
      )}
    </>
  );
};
