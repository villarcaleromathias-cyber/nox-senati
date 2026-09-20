const { useEffect, useMemo, useState } = React;

const firebaseConfig = {
  apiKey: "AIzaSyDXuDgZN8F5P6mYUq440AXDgpWKd08Q8VI",
  authDomain: "nexo-7bcde.firebaseapp.com",
  projectId: "nexo-7bcde",
  storageBucket: "nexo-7bcde.firebasestorage.app",
  messagingSenderId: "686648552215",
  appId: "1:686648552215:web:4bf61dd7550a3066b9a552"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const seedItems = [
  { id: 'demo-class', type: 'clase', title: 'Clase de bienvenida', date: new Date().toISOString().slice(0, 10), time: '08:00', endTime: '10:00', status: 'pendiente' },
  { id: 'demo-work', type: 'entregable', title: 'Organizar mi primera semana', date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), time: '23:59', status: 'pendiente' }
];

const menu = [
  ['calendario', 'Calendario general', '📅', 'Todo en un solo lugar', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80'],
  ['clases', 'Clases', '📓', 'Horarios y sesiones', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'],
  ['examenes', 'Exámenes y eventos', '📝', 'Fechas importantes', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80'],
  ['parciales', 'Parciales', '🎓', 'Evaluaciones del periodo', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80'],
  ['entregables', 'Entregables', '🚀', 'Trabajos y fechas límite', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=900&q=80'],
  ['cursos', 'Cursos y materiales', '📚', 'Cursos, notas y PDFs', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80']
];

function App() {
  const [section, setSection] = useState('menu');
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [sync, setSync] = useState('Conectando…');
  const [notice, setNotice] = useState(false);
  const [toast, setToast] = useState('');

  const agendaRef = useMemo(
    () => user ? db.collection('users').doc(user.uid).collection('agenda').doc('main') : null,
    [user]
  );

  useEffect(() => auth.onAuthStateChanged(currentUser => {
    setUser(currentUser);
    setAuthReady(true);
    if (!currentUser) {
      setItems([]);
      setCourses([]);
      setDataReady(false);
      setSync('Sin sesión');
    }
  }), []);

  useEffect(() => {
    if (!agendaRef) return undefined;
    setSync('Cargando nube…');
    return agendaRef.onSnapshot(async snapshot => {
      if (snapshot.exists) {
        const data = snapshot.data();
        setItems(Array.isArray(data.items) ? data.items : []);
        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } else {
        let local = null;
        try { local = JSON.parse(localStorage.getItem('nox-agenda-v2') || 'null'); } catch (_) {}
        const firstItems = local?.items?.length ? local.items : seedItems;
        const firstCourses = local?.courses || [];
        await agendaRef.set({ items: firstItems, courses: firstCourses, ownerUid: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      setDataReady(true);
      setSync('Guardado en Firebase');
    }, error => {
      console.error(error);
      setSync('Error de sincronización');
      setDataReady(true);
    });
  }, [agendaRef, user]);

  const showMessage = text => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2400);
  };

  const saveAgenda = async (nextItems, nextCourses) => {
    setItems(nextItems);
    setCourses(nextCourses);
    localStorage.setItem('nox-agenda-v2', JSON.stringify({ items: nextItems, courses: nextCourses }));
    if (!agendaRef || !user) return;
    setSync('Guardando…');
    try {
      await agendaRef.set({ items: nextItems, courses: nextCourses, ownerUid: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      setSync('Guardado en Firebase');
    } catch (error) {
      console.error(error);
      setSync('No se pudo guardar');
      showMessage('Revisa las reglas de Firestore');
    }
  };

  const token = async () => user ? user.getIdToken() : '';
  const apiHeaders = async () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` });

  const signIn = async () => {
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (error) {
      if (['auth/popup-blocked', 'auth/cancelled-popup-request'].includes(error.code)) await auth.signInWithRedirect(googleProvider);
      else if (error.code !== 'auth/popup-closed-by-user') showMessage('No se pudo iniciar sesión con Google');
    }
  };

  const addItem = item => {
    const next = [...items, { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    saveAgenda(next, courses); showMessage('Evento creado');
  };
  const updateItem = (id, patch) => {
    const next = items.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    saveAgenda(next, courses); showMessage('Cambios guardados');
  };
  const deleteItem = id => {
    if (!confirm('¿Eliminar este evento?')) return;
    saveAgenda(items.filter(item => item.id !== id), courses); showMessage('Evento eliminado');
  };
  const addCourse = course => {
    const next = [...courses, { ...course, id: crypto.randomUUID(), materials: [], createdAt: new Date().toISOString() }];
    saveAgenda(items, next); showMessage('Curso creado');
  };
  const updateCourse = (id, patch) => {
    const next = courses.map(course => course.id === id ? { ...course, ...patch, updatedAt: new Date().toISOString() } : course);
    saveAgenda(items, next); showMessage('Curso actualizado');
  };
  const deleteCourse = id => {
    if (!confirm('¿Eliminar el curso? Sus eventos se conservarán sin vínculo.')) return;
    const nextCourses = courses.filter(course => course.id !== id);
    const nextItems = items.map(item => item.courseId === id ? { ...item, courseId: '', courseName: '' } : item);
    saveAgenda(nextItems, nextCourses); showMessage('Curso eliminado');
  };

  const uploadMaterial = async (courseId, file, base64) => {
    const course = courses.find(entry => entry.id === courseId);
    const number = (course?.materials || []).length + 1;
    const response = await fetch('/api/drive/upload', { method: 'POST', headers: await apiHeaders(), body: JSON.stringify({ name: `PDF ${number}.pdf`, mimeType: file.type, base64, courseName: course.name }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo subir el PDF.');
    const material = { id: crypto.randomUUID(), name: `PDF ${number}`, originalName: file.name, driveId: data.file?.id || '', webViewLink: data.file?.webViewLink || '', uploadedAt: new Date().toISOString() };
    const next = courses.map(entry => entry.id === courseId ? { ...entry, materials: [...(entry.materials || []), material] } : entry);
    await saveAgenda(items, next); showMessage(`${material.name} subido`);
  };
  const deleteMaterial = (courseId, materialId) => {
    const next = courses.map(course => course.id === courseId ? { ...course, materials: (course.materials || []).filter(material => material.id !== materialId) } : course);
    saveAgenda(items, next); showMessage('Material eliminado de la agenda');
  };
  const applyAuroraAction = async (action, history) => {
    const response = await fetch('/api/assistant/apply', { method: 'POST', headers: await apiHeaders(), body: JSON.stringify({ state: { items, courses }, action, chatHistory: history }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo aplicar el cambio.');
    if (data.changed) await saveAgenda(data.items || [], data.courses || []);
    return data;
  };

  const pending = items.filter(item => item.status !== 'completado' && item.date).sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));
  const daysUntil = date => Math.ceil((new Date(`${date}T23:59:59`) - new Date()) / 86400000);

  if (!authReady) return <div className="screen-loader"><div className="loader-orb"/><p>Preparando NOX…</p></div>;
  if (!user) return <main className="login-page"><div className="login-backdrop"/><section className="login-card"><span className="eyebrow">AGENDA SENATI</span><h1>Organiza tu ciclo con <em>NOX</em></h1><p>Clases, exámenes, entregables, cursos y Aurora en una sola agenda sincronizada.</p><button className="google-button" onClick={signIn}><span className="google-mark">G</span>Continuar con Google</button><small>Tus datos se guardan únicamente dentro de tu cuenta.</small></section></main>;
  if (!dataReady) return <div className="screen-loader"><div className="loader-orb"/><p>Cargando tu agenda…</p></div>;

  return <div className="min-h-screen pb-24 app-shell">
    <header className="nox-header"><div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
      <button onClick={() => setSection('menu')} className="brand-button">NOX<span>.</span></button>
      <div className="flex items-center gap-2"><span className="sync-pill"><i/>{sync}</span><button className="notification-button" onClick={() => setNotice(!notice)} aria-label="Notificaciones">🔔{pending.length > 0 && <b>{pending.length}</b>}</button><div className="user-chip"><img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'N')}`} alt="Cuenta" referrerPolicy="no-referrer"/><span>{user.displayName?.split(' ')[0] || 'Estudiante'}</span><button onClick={() => auth.signOut()}>Salir</button></div></div>
    </div>{notice && <div className="notification-panel"><b>Próximos pendientes</b>{pending.length ? pending.slice(0, 8).map(item => <div className="notification-row" key={item.id}><div><b>{item.title}</b><span>{item.courseName || 'Sin curso'} · {item.date}{item.time ? ` · ${item.time}` : ''}</span></div><strong>{daysUntil(item.date) <= 0 ? 'Hoy' : daysUntil(item.date) === 1 ? 'Mañana' : `${daysUntil(item.date)} días`}</strong></div>) : <p className="text-xs text-zinc-500 mt-3">No tienes pendientes.</p>}</div>}</header>

    <main className="max-w-7xl mx-auto p-4 sm:p-6">
      {section !== 'menu' && <button className="back-button" onClick={() => setSection('menu')}>← Volver al menú</button>}
      {section === 'menu' && <><section className="home-hero"><div><span className="eyebrow">PANEL PERSONAL</span><h2>Hola, {user.displayName?.split(' ')[0] || 'estudiante'}.</h2><p>Tu semana académica, clara y bajo control.</p></div><div className="hero-stat"><strong>{pending.length}</strong><span>pendientes</span></div><div className="hero-stat"><strong>{courses.length}</strong><span>cursos</span></div></section><div className="section-heading"><div><h2>Tu centro de estudios</h2><p>Selecciona un apartado para comenzar.</p></div></div><div className="feature-grid">{menu.map(entry => <button key={entry[0]} onClick={() => setSection(entry[0])} className="feature-card" style={{ backgroundImage: `linear-gradient(180deg, rgba(8,8,12,.08), rgba(8,8,12,.94)), url('${entry[4]}')` }}><span className="feature-icon">{entry[2]}</span><div><h3>{entry[1]}</h3><p>{entry[3]}</p></div><b>→</b></button>)}</div><div className="aurora-tip"><span>✦</span><div><b>Habla con Aurora</b><p>Pídele “crear clase”, “listar pendientes”, “editar”, “completar” o escribe “ayuda”.</p></div></div></>}
      {section === 'calendario' && <CalendarioSection items={items}/>} 
      {section === 'clases' && <ClasesSection items={items} courses={courses} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}/>} 
      {section === 'examenes' && <ExamenesSection items={items} courses={courses} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}/>} 
      {section === 'parciales' && <ParcialesSection items={items} courses={courses} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}/>} 
      {section === 'entregables' && <EntregablesSection items={items} courses={courses} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}/>} 
      {section === 'cursos' && <CursosSection courses={courses} onAddCourse={addCourse} onUpdateCourse={updateCourse} onDeleteCourse={deleteCourse} onUploadMaterial={uploadMaterial} onDeleteMaterial={deleteMaterial}/>} 
    </main>
    <AuroraSphere items={items} courses={courses} onApplyAction={applyAuroraAction} getAuthToken={token}/>{toast && <div className="toast">{toast}</div>}
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
