import React, { useState } from 'react';

export default function VistasCombinadas({ tab, cursos, handleCrearCurso, clases, setClases, examenes, setExamenes, entregables, setEntregables }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({});

  const abrirModal = (item = null) => {
    setItemEditando(item);
    setFormData(item || {});
    setModalAbierto(true);
  };

  const guardarDatos = (e) => {
    e.preventDefault();
    if (tab === 'cursos') {
      handleCrearCurso(formData.nombre);
    } else if (tab === 'entregables') {
      if (itemEditando) {
        setEntregables(entregables.map(ent => ent.id === itemEditando.id ? { ...ent, ...formData } : ent));
      } else {
        setEntregables([...entregables, { id: Date.now(), ...formData }]);
      }
    } else if (tab === 'clases' || tab === 'parciales') {
       setClases([...clases, { id: Date.now(), tipo: tab, ...formData }]);
    } else if (tab === 'examenes') {
       setExamenes([...examenes, { id: Date.now(), ...formData }]);
    }
    setModalAbierto(false);
  };

  const eliminarItem = (id, listaTipo) => {
    if (listaTipo === 'entregables') setEntregables(entregables.filter(i => i.id !== id));
    if (listaTipo === 'examenes') setExamenes(examenes.filter(i => i.id !== id));
    if (listaTipo === 'clases') setClases(clases.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#111827] p-4 rounded-xl border border-slate-800">
        <h2 className="text-2xl font-bold text-cyan-400 capitalize">{tab}</h2>
        <button onClick={() => abrirModal()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white transition">
          + Añadir {tab.slice(0, -1)}
        </button>
      </div>

      {/* Renderizado de Entregables (Ejemplo de Editar y Eliminar) */}
      {tab === 'entregables' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entregables.map(ent => (
            <div key={ent.id} className="bg-[#1e293b] p-5 rounded-xl border-l-4 border-purple-500 relative group">
              <h3 className="font-bold text-lg mb-1">{ent.titulo}</h3>
              <p className="text-sm text-slate-400 mb-4">{ent.descripcion}</p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => abrirModal(ent)} className="text-blue-400 hover:text-blue-300 text-xs px-2">Editar</button>
                <button onClick={() => eliminarItem(ent.id, 'entregables')} className="text-red-400 hover:text-red-300 text-xs px-2">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renderizado de Cursos (Colores Dinámicos) */}
      {tab === 'cursos' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cursos.map(curso => (
            <div key={curso.id} className={`${curso.color} p-4 rounded-xl shadow-lg font-bold text-center text-white`}>
              {curso.nombre}
            </div>
          ))}
          {cursos.length === 0 && <p className="text-slate-500 col-span-full">No hay cursos. Añade uno para empezar.</p>}
        </div>
      )}

      {/* Renderizado de Clases / Exámenes (Calendario Simplificado) */}
      {(tab === 'clases' || tab === 'examenes' || tab === 'parciales') && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
             <div key={dia} className="bg-[#111827] border border-slate-800 rounded-xl p-3 min-h-[150px]">
               <div className="flex justify-between text-slate-400 font-bold border-b border-slate-800 pb-2 mb-2">
                 <span>{dia}</span>
                 <button onClick={() => { setFormData({dia}); abrirModal(); }} className="hover:text-cyan-400">+</button>
               </div>
               
               {/* Filtrar y mostrar las clases/examenes de este día */}
               {(tab === 'clases' || tab === 'parciales' ? clases : examenes)
                 .filter(item => item.dia === dia && (item.tipo === tab || !item.tipo))
                 .map(item => (
                   <div key={item.id} className="bg-[#1e293b] p-2 mt-2 rounded border-l-2 border-cyan-500 text-xs relative group">
                     <p className="font-bold text-white">{item.curso || item.tema}</p>
                     <p className="text-slate-400">{item.hora || item.fecha}</p>
                     <button onClick={() => eliminarItem(item.id, tab === 'examenes' ? 'examenes' : 'clases')} className="absolute top-1 right-1 hidden group-hover:block text-red-400">X</button>
                   </div>
               ))}
             </div>
          ))}
        </div>
      )}

      {/* EL MODAL PROFESIONAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardarDatos} className="bg-[#1e293b] rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {itemEditando ? 'Editar' : 'Añadir'} {tab.slice(0, -1)}
            </h3>
            
            <div className="space-y-4">
              {tab === 'cursos' && (
                <input required type="text" placeholder="Nombre del Curso" className="w-full bg-slate-800 p-3 rounded-lg outline-none focus:border-cyan-500 border border-transparent" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              )}
              
              {tab === 'entregables' && (
                <>
                  <input required defaultValue={formData.titulo} type="text" placeholder="¿Qué trabajo es? (Ej. Tarea 1)" className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, titulo: e.target.value})} />
                  <textarea defaultValue={formData.descripcion} placeholder="Descripción o detalles..." className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                </>
              )}

              {(tab === 'clases' || tab === 'examenes' || tab === 'parciales') && (
                <>
                  <select required className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, curso: e.target.value})}>
                    <option value="">Selecciona el Curso...</option>
                    {cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                  {tab === 'examenes' ? (
                     <input required type="text" placeholder="Tema del Examen" className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, tema: e.target.value})} />
                  ) : (
                     <input required type="time" className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, hora: e.target.value})} />
                  )}
                  {/* Selector de día forzado si no se clickeó desde una columna */}
                  {!formData.dia && (
                    <select className="w-full bg-slate-800 p-3 rounded-lg text-white" onChange={e => setFormData({...formData, dia: e.target.value})}>
                      <option value="">Día de la semana...</option>
                      {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
