const { useState, useEffect, useRef } = React;

window.AuroraSphere = function AuroraSphere() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'aurora', text: 'Hola, soy Aurora. Puedo leer tu calendario, analizar PDFs de tus cursos y leer tus datos de SENATI. ¿En qué te ayudo hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { sender: 'aurora', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'aurora', text: `⚠️ ${data.error || 'No se pudo procesar la solicitud.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'aurora', text: '⚠️ Error de conexión con el servidor de Render.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      <div className="aurora-sphere" onClick={() => setOpen(!open)} title="Abrir Aurora IA">
        ✨
      </div>
      
      {open && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 h-[460px] max-h-[80vh] bg-zinc-950 border border-purple-500/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all">
          <div className="p-4 bg-gradient-to-r from-purple-900 to-blue-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="font-bold text-white text-base">Aurora IA</h3>
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
              <div className="bg-zinc-800/80 p-3 rounded-2xl rounded-tl-none w-auto inline-block text-zinc-400 text-xs italic animate-pulse">
                Aurora está pensando...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-950 shrink-0">
            <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 active:scale-95 transition" title="Subir foto/PDF">📎</button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pídele algo a Aurora..." 
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
