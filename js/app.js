const { useState } = React;

function App() {
  const [currentSection, setCurrentSection] = useState('menu');
  
  const menuItems = [
    {id:'calendario', name:'Calendario', icon:'📅'},
    {id:'clases', name:'Clases', icon:'📓'},
    {id:'examenes', name:'Exámenes & Eventos', icon:'📝'},
    {id:'parciales', name:'Parciales', icon:'🎓'},
    {id:'entregables', name:'Entregables', icon:'🚀'},
    {id:'cursos', name:'Cursos & Materiales', icon:'📚'}
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="p-4 sm:p-6 border-b border-zinc-900 flex justify-between items-center bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-purple-400 cursor-pointer active:scale-95 transition" onClick={() => setCurrentSection('menu')}>NOX</h1>
        <div className="text-xs sm:text-sm text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">Panel SENATI</div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {currentSection !== 'menu' && (
          <button onClick={() => setCurrentSection('menu')} className="mb-6 text-xs sm:text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold active:scale-95 transition">
            ← Volver al menú
          </button>
        )}

        {currentSection === 'menu' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {menuItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => setCurrentSection(item.id)} 
                className="card-nox p-6 sm:p-8 rounded-3xl cursor-pointer hover:bg-zinc-900 active:scale-95 transition flex flex-col items-center justify-center text-center group"
              >
                <span className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition">{item.icon}</span>
                <h3 className="font-bold text-sm sm:text-lg text-zinc-200 group-hover:text-purple-400 transition">{item.name}</h3>
              </div>
            ))}
          </div>
        )}

        {currentSection === 'calendario' && <CalendarioSection />}
        {currentSection === 'clases' && <ClasesSection />}
        {currentSection === 'examenes' && <ExamenesSection />}
        {currentSection === 'parciales' && <ParcialesSection />}
        {currentSection === 'entregables' && <EntregablesSection />}
        {currentSection === 'cursos' && <CursosSection />}
      </main>

      <AuroraSphere />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
