const {useState,useEffect,useRef}=React;
window.AuroraSphere=function AuroraSphere({items=[],courses=[],onApplyAction}){
 const [open,setOpen]=useState(false),[messages,setMessages]=useState([{sender:'aurora',text:'Hola, soy Aurora. Puedo crear, editar, completar y eliminar elementos de tu agenda. Escribe “ayuda” para ver mis comandos.'}]),[input,setInput]=useState(''),[loading,setLoading]=useState(false),[file,setFile]=useState(null);
 const end=useRef(null),fileRef=useRef(null);
 useEffect(()=>end.current?.scrollIntoView({behavior:'smooth'}),[messages,open]);
 const send=async()=>{if((!input.trim()&&!file)||loading)return;const text=input.trim(),shown=text+(file?` 📄 [${file.name}]`:''),history=[...messages,{sender:'user',text:shown}];setMessages(history);setInput('');setFile(null);setLoading(true);
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,fileData:file,history:messages.slice(-8),state:{items,courses}})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Error de Aurora');
   let reply=d.reply||'Entendido.';
   if(d.action?.action&&d.action.action!=='none'&&d.action.action!=='help'&&d.action.action!=='list'){const a=await onApplyAction(d.action,history);reply=a.message||reply}
   if(d.action?.action==='list'){const p=items.filter(x=>x.status!=='completado').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,10);reply=p.length?'Pendientes: '+p.map(x=>`${x.title} (${x.date}${x.time?' '+x.time:''})`).join(' · '):'No tienes pendientes.'}
   if(d.action?.action==='help')reply='Comandos: crear clase, crear examen, crear parcial, crear entregable, crear curso, editar, eliminar, completar, listar pendientes, listar cursos y ayuda. Puedes escribirlos en lenguaje natural.';
   setMessages(v=>[...v,{sender:'aurora',text:reply}]);
  }catch(e){setMessages(v=>[...v,{sender:'aurora',text:'⚠️ '+e.message}])}finally{setLoading(false)}};
 const read=f=>{const r=new FileReader();r.onload=()=>setFile({name:f.name,content:r.result});r.readAsText(f)};
 return <><button className="aurora-sphere" onClick={()=>setOpen(!open)} title="Abrir Aurora IA">✨</button>{open&&<div className="aurora-window"><div className="aurora-header"><div><b>✦ Aurora IA</b><span>Control inteligente de tu agenda</span></div><button onClick={()=>setOpen(false)}>×</button></div><div className="aurora-messages">{messages.map((m,i)=><div key={i} className={`aurora-message ${m.sender}`}>{m.text}</div>)}{loading&&<div className="aurora-message aurora">Estoy pensando y aplicando el cambio…</div>}<div ref={end}/></div>{file&&<div className="aurora-attachment">📄 {file.name} <button onClick={()=>setFile(null)}>×</button></div>}<div className="aurora-composer"><button onClick={()=>fileRef.current.click()}>📄</button><input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" hidden onChange={e=>e.target.files[0]&&read(e.target.files[0])}/><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Pídele algo a Aurora…"/><button onClick={send} disabled={loading}>➤</button></div></div>}</>;
};
