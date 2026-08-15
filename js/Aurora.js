const { useState, useEffect, useRef } = React;

window.AuroraSphere = function AuroraSphere({ items, onUpdateItems }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'aurora', text: 'Hola, soy Aurora. He sincronizado tus datos con Google Drive. Puedes adjuntarme imágenes 📷 o archivos 📄 y me encargaré de analizarlos e incorporarlos a tu agenda.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Selección de archivo de texto/PDF
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        content: event.target.result
      });
    };
    reader.readAsText(file);
  };

  // Selección de foto/imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage && !attachedFile) || loading) return;

    const userMsgText = input.trim();
    const currentImg = attachedImage;
    const currentFile = attachedFile;

    // Limpiar entradas
    setInput('');
    setAttachedImage(null);
    setAttachedFile(null);

    let displayMsg = userMsgText;
    if (currentImg) displayMsg += ' 📷 [Imagen Adjuntada]';
    if (currentFile) displayMsg += ` 📄 [Archivo: ${currentFile.name}]`;

    const newHistory = [...messages, { sender: 'user', text: displayMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          image: currentImg,
          fileData: currentFile,
          history: messages.slice(-6)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { sender: 'aurora', text: data.reply }]);
        
        // Auto-sincronizar con Google Drive
        fetch('/api/drive/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, chatHistory: newHistory })
        });
      } else {
        setMessages(prev => [...prev, { sender: 'aurora', text: `⚠️ ${data.error || 'Error de conexión.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'aurora', text: '⚠️ No se pudo enviar el mensaje al servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botones ocultos para selección de archivos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".txt,.pdf,.doc,.docx" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="aurora-sphere" onClick={() => setOpen(!open)} title="Abrir Aurora IA">
        ✨
      </div>
      
      {open && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 h-[480px] max-h-[82vh] bg-zinc-950 border border-purple-500/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all">
          <div className="p-4 bg-gradient-to-r from-purple-900 to-blue-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <h3 className="font-bold text-white text-base">Aurora IA</h3>
                <span className="text-[10px] text-purple-200 block">Sincronizada con Google Drive</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white font-bold px-2 text-xl hover:text-purple-300">×</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-3">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-2xl max-w-[90%] text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-purple-600 text-white ml-auto rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 mr-auto rounded-tl-none border border-zinc-700/50'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-zinc-800/80 p-3 rounded-2xl rounded-tl-none text-zinc-400 text-xs italic animate-pulse">
                Aurora está analizando tus archivos...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Vistas previas de adjuntos */}
          {(attachedImage || attachedFile) && (
            <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex gap-2 text-xs">
              {attachedImage && (
                <span className="bg-purple-900/50 border border-purple-500/40 text-purple-200 px-2 py-1 rounded-lg flex items-center gap-1">
                  📷 Foto lista <button onClick={() => setAttachedImage(null)} className="text-red-400 font-bold ml-1">×</button>
                </span>
              )}
              {attachedFile && (
                <span className="bg-blue-900/50 border border-blue-500/40 text-blue-200 px-2 py-1 rounded-lg flex items-center gap-1 truncate max-w-[200px]">
                  📄 {attachedFile.name} <button onClick={() => setAttachedFile(null)} className="text-red-400 font-bold ml-1">×</button>
                </span>
              )}
            </div>
          )}

          <div className="p-3 border-t border-zinc-800 flex gap-1.5 bg-zinc-950 shrink-0">
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="p-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-xl text-xs flex items-center gap-1" 
              title="Adjuntar Documento/PDF"
            >
              📄
            </button>
            <button 
              onClick={() => imageInputRef.current.click()} 
              className="p-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-xl text-xs flex items-center gap-1" 
              title="Adjuntar Foto/Imagen"
            >
              📷
            </button>

            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe a Aurora..." 
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition" 
            />
            <button 
              onClick={sendMessage}
              disabled={loading}
              className="p-2 bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};
