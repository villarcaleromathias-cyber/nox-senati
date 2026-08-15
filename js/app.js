import React, { useState } from 'react';
import VistasCombinadas from './components/VistasCombinadas';
import AuroraBall from './components/AuroraBall';

export default function App() {
  const [currentTab, setCurrentTab] = useState('clases');
  
  // Base de datos temporal en memoria
  const [cursos, setCursos] = useState([]);
  const [clases, setClases] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [entregables, setEntregables] = useState([]);

  // Paleta de colores para los cursos
  const colores = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'];

  const handleCrearCurso = (nombre) => {
    const color = colores[cursos.length % colores.length]; // Asigna un color único
    setCursos([...cursos, { id: Date.now(), nombre, color }]);
  };

  // Función que Aurora usará para ejecutar acciones reales
  const ejecutarComandoIA = (comando) => {
    try {
      const { tipo, datos } = comando;
      if (tipo === 'ADD_CURSO') handleCrearCurso(datos.curso);
      if (tipo === 'ADD_ENTREGABLE') setEntregables([...entregables, { id: Date.now(), ...datos }]);
      if (tipo === 'ADD_CLASE') setClases([...clases, { id: Date.now(), ...datos }]);
      if (tipo === 'ADD_EXAMEN') setExamenes([...examenes, { id: Date.now(), ...datos }]);
    } catch (e) {
      console.error("Error ejecutando comando de IA", e);
    }
  };

  const tabs = [
    { id: 'clases', icon: '📓', label: 'Clases' },
    { id: 'parciales', icon: '🎓', label: 'Parciales' },
    { id: 'examenes', icon: '📄', label: 'Exámenes' },
    { id: 'entregables', icon: '📁', label: 'Entregables' },
    { id: 'cursos', icon: '📚', label: 'Cursos' }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-sans p-4 relative selection:bg-cyan-500 selection:text-black">
      <header className="max-w-7xl mx-auto mb-6 flex justify-between border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          SENATI <span className="text-xs bg-blue-950 border border-blue-500 rounded-full px-2 py-1 text-white">PRO</span>
        </h1>
      </header>

      {/* Menú de Navegación Mejorado */}
      <nav className="max-w-7xl mx-auto flex flex-wrap gap-4 mb-8">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${
              currentTab === tab.id ? 'bg-[#1e293b] border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-[#111827] border border-slate-800 hover:border-slate-600'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Vistas (Le pasamos todos los datos y funciones) */}
      <main className="max-w-7xl mx-auto">
        <VistasCombinadas 
          tab={currentTab} 
          cursos={cursos} handleCrearCurso={handleCrearCurso}
          clases={clases} setClases={setClases}
          examenes={examenes} setExamenes={setExamenes}
          entregables={entregables} setEntregables={setEntregables}
        />
      </main>

      <AuroraBall onAccionIA={ejecutarComandoIA} />
    </div>
  );
}
