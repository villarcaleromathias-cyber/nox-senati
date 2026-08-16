const express=require('express');
const path=require('path');
const cors=require('cors');
const fs=require('fs');
const os=require('os');
const crypto=require('crypto');
const {google}=require('googleapis');
require('dotenv').config();

const app=express();
const PORT=process.env.PORT||3000;
const GROQ_API_KEY=process.env.GROQ_API_KEY;
const GROQ_MODEL=process.env.GROQ_MODEL||'openai/gpt-oss-120b';
const DRIVE_FOLDER_ID=process.env.GOOGLE_DRIVE_FOLDER_ID||'';

app.use(cors());
app.use(express.json({limit:'60mb'}));
app.use(express.urlencoded({limit:'60mb',extended:true}));
app.use(express.static(path.join(__dirname)));

const safeJson=(v,f=null)=>{try{return typeof v==='string'?JSON.parse(v):v}catch{return f}};
const uid=()=>crypto.randomUUID();

function normalizeItem(x={}){
  return {id:x.id||uid(),type:x.type||'clase',title:String(x.title||'Sin título'),
    date:x.date||new Date().toISOString().slice(0,10),time:x.time||'',endTime:x.endTime||'',
    courseId:x.courseId||'',courseName:x.courseName||'',notes:x.notes||'',
    status:x.status||'pendiente',color:x.color||'',createdAt:x.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()};
}
function normalizeCourse(x={}){
  return {id:x.id||uid(),name:String(x.name||'Nuevo curso'),teacher:x.teacher||'',room:x.room||'',
    color:x.color||'#8b5cf6',schedule:Array.isArray(x.schedule)?x.schedule:[],
    materials:Array.isArray(x.materials)?x.materials:[],notes:x.notes||'',
    createdAt:x.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
}
function findCourse(courses,q=''){
  const s=String(q).toLowerCase().trim(); if(!s)return null;
  return courses.find(c=>c.id===q||c.name.toLowerCase()===s)||courses.find(c=>c.name.toLowerCase().includes(s));
}

function applyAction(state={},a={}){
  let items=(state.items||[]).map(normalizeItem),courses=(state.courses||[]).map(normalizeCourse);
  const typeMap={clase:'clase',clases:'clase',examen:'examen',parcial:'parcial',entregable:'entregable',trabajo:'entregable'};
  const kind=String(a.action||'none').toLowerCase();

  if(kind==='create_course'){
    const c=normalizeCourse(a.course||{name:a.title,color:a.color}); courses.push(c);
    return {items,courses,result:c,changed:true};
  }
  if(kind==='update_course'){
    const c=findCourse(courses,a.courseId||a.courseName||a.title);
    if(!c)return {items,courses,error:'No encontré ese curso.',changed:false};
    Object.assign(c,a.course||{});c.updatedAt=new Date().toISOString();
    return {items,courses,result:c,changed:true};
  }
  if(kind==='delete_course'){
    const c=findCourse(courses,a.courseId||a.courseName||a.title);
    if(!c)return {items,courses,error:'No encontré ese curso.',changed:false};
    courses=courses.filter(x=>x.id!==c.id);
    items=items.map(i=>i.courseId===c.id?{...i,courseId:'',courseName:''}:i);
    return {items,courses,result:c,changed:true};
  }
  if(kind==='create'){
    const c=findCourse(courses,a.courseId||a.courseName);
    const item=normalizeItem({...a.item,type:typeMap[a.type]||'clase',title:a.item?.title||a.title,
      date:a.item?.date||a.date,time:a.item?.time||a.time,endTime:a.item?.endTime||a.endTime,
      courseId:a.item?.courseId||c?.id||a.courseId||'',courseName:a.item?.courseName||c?.name||a.courseName||'',
      notes:a.item?.notes||a.notes||''});
    items.push(item);return {items,courses,result:item,changed:true};
  }
  if(kind==='update'||kind==='complete'){
    const target=a.id?items.find(i=>i.id===a.id):items.find(i=>
      (a.title&&i.title.toLowerCase().includes(String(a.title).toLowerCase()))||
      (a.courseName&&i.courseName.toLowerCase().includes(String(a.courseName).toLowerCase())));
    if(!target)return {items,courses,error:'No encontré el evento que quieres editar.',changed:false};
    Object.assign(target,a.item||{});if(kind==='complete')target.status='completado';
    target.updatedAt=new Date().toISOString();return {items,courses,result:target,changed:true};
  }
  if(kind==='delete'){
    const before=items.length;
    items=items.filter(i=>{
      if(a.id)return i.id!==a.id;
      return !((a.title&&i.title.toLowerCase().includes(String(a.title).toLowerCase()))||
               (a.courseName&&i.courseName.toLowerCase().includes(String(a.courseName).toLowerCase())));
    });
    return {items,courses,result:{deleted:before-items.length},changed:before!==items.length};
  }
  if(kind==='delete_material'){
    const c=findCourse(courses,a.courseId||a.courseName);
    if(!c)return {items,courses,error:'No encontré ese curso.',changed:false};
    c.materials=(c.materials||[]).filter(m=>m.id!==a.materialId);c.updatedAt=new Date().toISOString();
    return {items,courses,result:c,changed:true};
  }
  return {items,courses,changed:false};
}

function googleAuth(){
  const raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON;if(!raw)return null;
  try{const credentials=safeJson(raw);if(!credentials?.client_email||!credentials?.private_key)return null;
    return new google.auth.GoogleAuth({credentials,scopes:['https://www.googleapis.com/auth/drive']});
  }catch(e){console.error('Credenciales Google inválidas:',e.message);return null}
}
function driveClient(){const auth=googleAuth();return auth?google.drive({version:'v3',auth}):null}

async function ensureFolder(drive,name,parentId=null){
  const parent=parentId?` and '${parentId}' in parents`:'';
  const q=`name = '${name.replace(/'/g,"\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parent}`;
  const r=await drive.files.list({q,fields:'files(id,name)',pageSize:1});
  if(r.data.files?.[0])return r.data.files[0].id;
  const r2=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.folder',...(parentId?{parents:[parentId]}:{})},fields:'id'});
  return r2.data.id;
}

async function saveDrive(payload){
  const drive=driveClient();if(!drive)return {enabled:false};
  const folder=DRIVE_FOLDER_ID||await ensureFolder(drive,'NOX Agenda SENATI');
  const q=`name = 'nox-agenda-data.json' and '${folder}' in parents and trashed = false`;
  const found=await drive.files.list({q,fields:'files(id,name)',pageSize:1});
  const tmp=path.join(os.tmpdir(),`nox-${Date.now()}.json`);
  fs.writeFileSync(tmp,JSON.stringify({...payload,savedAt:new Date().toISOString()},null,2));
  const media={mimeType:'application/json',body:fs.createReadStream(tmp)};
  let r;
  if(found.data.files?.[0])r=await drive.files.update({fileId:found.data.files[0].id,media,fields:'id,name,modifiedTime'});
  else r=await drive.files.create({requestBody:{name:'nox-agenda-data.json',parents:[folder],mimeType:'application/json'},media,fields:'id,name,modifiedTime'});
  fs.unlinkSync(tmp);return {enabled:true,file:r.data};
}

async function loadDrive(){
  const drive=driveClient();if(!drive)return {enabled:false,data:null};
  const folder=DRIVE_FOLDER_ID||await ensureFolder(drive,'NOX Agenda SENATI');
  const q=`name = 'nox-agenda-data.json' and '${folder}' in parents and trashed = false`;
  const r=await drive.files.list({q,fields:'files(id,name)',pageSize:1});
  if(!r.data.files?.[0])return {enabled:true,data:null};
  const data=await drive.files.get({fileId:r.data.files[0].id,alt:'media'});
  return {enabled:true,data:data.data};
}

async function uploadDrive({name,mimeType,base64,courseName}){
  const drive=driveClient();if(!drive)return {enabled:false,error:'Google Drive no está configurado en el servidor.'};
  const root=DRIVE_FOLDER_ID||await ensureFolder(drive,'NOX Agenda SENATI');
  const folder=courseName?await ensureFolder(drive,courseName,root):root;
  const clean=String(base64).replace(/^data:[^;]+;base64,/,'');
  const buf=Buffer.from(clean,'base64');
  const tmp=path.join(os.tmpdir(),`nox-${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g,'_')}`);
  fs.writeFileSync(tmp,buf);
  const r=await drive.files.create({requestBody:{name,parents:[folder]},media:{mimeType:mimeType||'application/octet-stream',body:fs.createReadStream(tmp)},fields:'id,name,mimeType,size,webViewLink,createdTime'});
  fs.unlinkSync(tmp);return {enabled:true,file:r.data};
}

const SCHEMA={type:'object',additionalProperties:false,properties:{
 action:{type:'string',enum:['none','help','list','create','update','delete','complete','create_course','update_course','delete_course','delete_material']},
 type:{type:'string',enum:['clase','examen','parcial','entregable','']},title:{type:'string'},courseName:{type:'string'},
 courseId:{type:'string'},date:{type:'string'},time:{type:'string'},endTime:{type:'string'},notes:{type:'string'},
 color:{type:'string'},id:{type:'string'},materialId:{type:'string'},item:{type:'object',additionalProperties:true},
 course:{type:'object',additionalProperties:true}
},required:['action','type','title','courseName','courseId','date','time','endTime','notes','color','id','materialId','item','course']};

async function askAurora(message,state,history=[]){
  if(!GROQ_API_KEY)return {reply:'Aurora está en modo local. Configura GROQ_API_KEY para comprensión avanzada.',action:{action:'none'}};
  const system=`Eres Aurora, asistente de NOX Agenda SENATI. Entiende español natural y convierte peticiones en acciones.
Puedes crear, editar, completar y eliminar clases, exámenes, parciales y entregables; también crear, editar y eliminar cursos.
Vincula eventos con cursos cuando sea posible. Fechas YYYY-MM-DD y horas HH:MM. No inventes IDs. Si falta una fecha inequívoca, déjala vacía.
Si piden ayuda usa help. Si piden consultar/listar usa list. No hagas cambios ambiguos.`;
  const body={model:GROQ_MODEL,messages:[
    {role:'system',content:system},{role:'system',content:`Estado actual:\n${JSON.stringify(state)}`},
    ...(history||[]).slice(-8).map(h=>({role:h.sender==='user'?'user':'assistant',content:h.text})),
    {role:'user',content:message}
  ],temperature:.1,response_format:{type:'json_schema',json_schema:{name:'nox_action',strict:true,schema:SCHEMA}}};
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',
    headers:{Authorization:`Bearer ${GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Error en Groq.');
  const action=safeJson(data.choices?.[0]?.message?.content||'{}',{action:'none'});
  return {reply:'Entendido.',action};
}

app.get('/api/health',(req,res)=>res.json({ok:true,aurora:Boolean(GROQ_API_KEY),drive:Boolean(googleAuth()),model:GROQ_MODEL}));

app.post('/api/chat',async(req,res)=>{
  try{
    const {message,image,fileData,history,state}=req.body;
    if(!message&&!image&&!fileData)return res.status(400).json({error:'No recibí ningún mensaje o archivo.'});
    if(message){const r=await askAurora(message,state||{items:[],courses:[]},history);return res.json(r)}
    res.json({reply:'Recibí el archivo. Puedes pedirme que lo use en tu agenda cuando esté disponible como texto.',action:{action:'none'}});
  }catch(e){console.error('Aurora:',e);res.status(500).json({error:e.message||'Error interno de Aurora.'})}
});

app.post('/api/assistant/apply',async(req,res)=>{
  try{
    const result=applyAction(req.body.state||{},req.body.action||{});
    if(result.changed)try{await saveDrive({items:result.items,courses:result.courses,chatHistory:req.body.chatHistory||[]})}catch(e){console.error('Drive:',e.message)}
    res.json({...result,message:result.error||(result.changed?'Cambio aplicado correctamente.':'No hubo cambios.')});
  }catch(e){res.status(500).json({error:e.message||'No se pudo aplicar la acción.'})}
});

app.post('/api/drive/sync',async(req,res)=>{
  try{const r=await saveDrive(req.body);res.json({status:'success',drive:r.enabled,message:r.enabled?'Agenda sincronizada con Google Drive.':'Agenda guardada localmente; Google Drive no está configurado.'})}
  catch(e){res.status(500).json({error:'No se pudo sincronizar con Google Drive.'})}
});
app.get('/api/drive/sync',async(req,res)=>{
  try{const r=await loadDrive();res.json(r.data||{items:[],courses:[],chatHistory:[]})}
  catch(e){res.status(500).json({error:'No se pudo cargar la agenda desde Google Drive.'})}
});
app.post('/api/drive/upload',async(req,res)=>{
  try{const {name,mimeType,base64,courseName}=req.body;if(!name||!base64)return res.status(400).json({error:'Faltan datos del archivo.'});
    const r=await uploadDrive({name,mimeType,base64,courseName});if(!r.enabled)return res.status(503).json(r);res.json(r);
  }catch(e){console.error('Upload Drive:',e);res.status(500).json({error:e.message||'No se pudo subir el archivo.'})}
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`Servidor Nox iniciado en puerto ${PORT}`));
