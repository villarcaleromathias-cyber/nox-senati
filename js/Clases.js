const { useState } = React;

window.ClasesSection=function ClasesSection({items=[],courses=[],onAddItem,onUpdateItem,onDeleteItem}){
  const [year,setYear]=useState(new Date().getFullYear()),[month,setMonth]=useState(new Date().getMonth());
  const [day,setDay]=useState(null),[editing,setEditing]=useState(null);
  const [form,setForm]=useState({title:'',courseId:'',time:'08:00',endTime:'10:00',notes:''});
  const now=new Date(),monthName=new Date(year,month).toLocaleString('es-ES',{month:'long'});
  const classes=items.filter(i=>i.type==='clase'&&new Date(i.date).getFullYear()===year&&new Date(i.date).getMonth()===month);
  const move=d=>{let m=month+d,y=year;if(m>11){m=0;y++}if(m<0){m=11;y--}setMonth(m);setYear(y)};
  const open=(d,x=null)=>{setDay(d);setEditing(x);setForm(x?{...x}:{title:'',courseId:'',time:'08:00',endTime:'10:00',notes:''})};
  const close=()=>{setDay(null);setEditing(null)};
  const save=()=>{if(!day||!form.title.trim())return alert('Escribe el nombre de la clase.');const c=courses.find(x=>x.id===form.courseId);
    const item={...form,type:'clase',title:form.title.trim(),date:new Date(year,month,day).toISOString().slice(0,10),courseName:c?.name||'',color:c?.color||'#3b82f6',status:editing?.status||'pendiente'};
    editing?onUpdateItem(editing.id,item):onAddItem(item);close()};
  return <div className="space-y-6">
    <div className="card-nox p-4 sm:p-6 rounded-3xl flex flex-col lg:flex-row justify-between gap-4"><div><h2 className="text-xl sm:text-2xl font-bold capitalize">Clases de {monthName} {year}</h2><p className="text-xs text-zinc-500">Pulsa un día para añadir una clase y elegir curso y horario.</p></div><div className="flex gap-2"><button className="nox-btn" onClick={()=>move(-1)}>←</button><button className="nox-btn" onClick={()=>{setYear(now.getFullYear());setMonth(now.getMonth())}}>Hoy</button><button className="nox-btn" onClick={()=>move(1)}>→</button></div></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{classes.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(x=><div key={x.id} className="card-nox p-4 rounded-2xl"><div className="text-xs text-blue-400 font-bold">{x.date} · {x.time||'--:--'}</div><b>{x.title}</b><p className="text-xs text-zinc-500">{x.courseName||'Sin curso'}</p><div className="flex gap-2 mt-3"><button className="nox-btn text-xs" onClick={()=>open(new Date(x.date).getDate(),x)}>Editar</button><button className="nox-btn danger text-xs" onClick={()=>onDeleteItem(x.id)}>Eliminar</button></div></div>)}</div>
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div key={d} className="text-center text-xs font-bold text-zinc-500 py-2">{d}</div>)}{Array.from({length:(new Date(year,month,1).getDay()+6)%7}).map((_,i)=><div key={'e'+i}/>)}
    {Array.from({length:new Date(year,month+1,0).getDate()}).map((_,i)=>{const d=i+1,dayItems=classes.filter(x=>new Date(x.date).getDate()===d),today=now.getFullYear()===year&&now.getMonth()===month&&now.getDate()===d;return <button key={d} onClick={()=>open(d)} className={`calendar-day ${today?'today':''}`}><span className="font-bold">{d}</span><div className="space-y-1 mt-2">{dayItems.slice(0,3).map(x=><div key={x.id} className="event-chip blue">{x.time?x.time+' ':''}{x.title}</div>)}</div><span className="add-day">+ Añadir clase</span></button>})}</div>
    {day&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal-card"><div className="flex justify-between mb-5"><div><h3 className="text-xl font-black">{editing?'Editar clase':'Nueva clase'}</h3><p className="text-xs text-zinc-500">{day} de {monthName}</p></div><button className="nox-icon" onClick={close}>×</button></div><div className="space-y-3">
      <label className="field-label">Curso<select className="nox-input" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}><option value="">Sin curso / crear después</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="field-label">Nombre<input className="nox-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Clase 1"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="field-label">Inicio<input type="time" className="nox-input" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label><label className="field-label">Fin<input type="time" className="nox-input" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})}/></label></div>
      <label className="field-label">Notas<textarea className="nox-input" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <button className="w-full nox-primary" onClick={save}>{editing?'Guardar cambios':'Crear clase'}</button>
    </div></div></div>}
  </div>;
};
