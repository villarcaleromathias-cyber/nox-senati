const { useState } = React;

function App() {
  const [currentSection, setCurrentSection] = useState('menu');
  const pastelAccent = '#c084fc';
  
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
      <header className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black sticky top-0 z-30">
        <h1 className="text-3xl font-black tracking-widest text-purple-400 cursor-pointer" onClick={() => setCurrentSection('menu')}>NOX</h1>
        <div className="text-sm text-zinc-400">Panel SENATI</div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {currentSection !== 'menu' && (
          <button onClick={() => setCurrentSection('menu')} className="mb-6 text-zinc-400 hover:text-white">← Volver al menú</button>
        )}

        {currentSection === 'menu' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <div key={item.id} onClick={() => setCurrentSection(item.id)} className="card-nox p-8 rounded-3xl cursor-pointer hover:bg-zinc-900 transition flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4">{item.icon}</span>
                <h3 className="font-bold text-lg">{item.name}</h3>
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
