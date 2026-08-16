const { useState, useEffect, useRef } = React;

window.AuroraSphere = function AuroraSphere({
  items = [],
  courses = [],
  onApplyAction
}) {

  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'aurora',
      text:
        'Hola, soy Aurora. Puedo crear, editar, completar y eliminar elementos de tu agenda. Escribe "ayuda" para ver mis comandos.'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages, open]);

  const handleFileUpload = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {

      setAttachedFile({
        name: file.name,
        content: reader.result
      });

    };

    reader.readAsText(file);
  };

  const sendMessage = async () => {

    if (
      (
        !input.trim() &&
        !attachedFile
      ) ||
      loading
    ) {
      return;
    }

    const userText =
      input.trim();

    const currentFile =
      attachedFile;

    const displayText =
      userText +
      (
        currentFile
          ? ` 📄 [Archivo: ${currentFile.name}]`
          : ''
      );

    const newHistory = [
      ...messages,
      {
        sender: 'user',
        text: displayText
      }
    ];

    setMessages(
      newHistory
    );

    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {

      const response =
        await fetch(
          '/api/chat',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                message:
                  userText,

                fileData:
                  currentFile,

                history:
                  messages.slice(-8),

                state: {
                  items,
                  courses
                }
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          'Error de Aurora.'
        );
      }

      let reply =
        data.reply ||
        'Entendido.';

      const action =
        data.action?.action;

      if (
        action &&
        action !== 'none' &&
        action !== 'help' &&
        action !== 'list'
      ) {

        const result =
          await onApplyAction(
            data.action,
            newHistory
          );

        reply =
          result?.message ||
          reply;
      }

      if (
        action === 'list'
      ) {

        const pending =
          items
            .filter(
              item =>
                item.status !==
                'completado'
            )
            .sort(
              (a, b) =>
                (
                  a.date +
                  a.time
                ).localeCompare(
                  b.date +
                  b.time
                )
            )
            .slice(
              0,
              10
            );

        reply =
          pending.length

            ? (
                'Pendientes: ' +
                pending
                  .map(
                    item =>
                      `${item.title} (${item.date}${item.time ? ` ${item.time}` : ''})`
                  )
                  .join(' · ')
              )

            : 'No tienes pendientes.';
      }

      if (
        action === 'help'
      ) {

        reply =
          [
            'Comandos de Aurora:',
            '',
            '• crear clase',
            '• crear examen',
            '• crear parcial',
            '• crear entregable',
            '• crear curso',
            '• editar',
            '• eliminar',
            '• completar',
            '• listar pendientes',
            '• listar cursos',
            '• ayuda',
            '',
            'Puedes escribirlos en lenguaje natural.'
          ].join('\n');
      }

      setMessages(
        previous => [
          ...previous,
          {
            sender: 'aurora',
            text: reply
          }
        ]
      );

    } catch (error) {

      setMessages(
        previous => [
          ...previous,
          {
            sender: 'aurora',
            text:
              `⚠️ ${error.message || 'No se pudo procesar la solicitud.'}`
          }
        ]
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      <button
        className="aurora-sphere"
        onClick={() =>
          setOpen(
            value => !value
          )
        }
        title="Abrir Aurora IA"
      >
        ✨
      </button>

      {open && (

        <div className="aurora-window">

          <div className="aurora-header">

            <div>

              <b>
                ✦ Aurora IA
              </b>

              <span>
                Control inteligente
                de tu agenda
              </span>

            </div>

            <button
              onClick={() =>
                setOpen(false)
              }
            >
              ×
            </button>

          </div>

          <div className="aurora-messages">

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={
                    `aurora-message ${
                      message.sender
                    }`
                  }
                >
                  {message.text}
                </div>

              )
            )}

            {loading && (

              <div className="
                aurora-message
                aurora
              ">
                Aurora está pensando
                y aplicando el cambio…
              </div>

            )}

            <div
              ref={chatEndRef}
            />

          </div>

          {attachedFile && (

            <div className="
              aurora-attachment
            ">

              📄 {attachedFile.name}

              <button
                onClick={() =>
                  setAttachedFile(null)
                }
              >
                ×
              </button>

            </div>

          )}

          <div className="
            aurora-composer
          ">

            <button
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
              title="Adjuntar archivo"
            >
              📄
            </button>

            <input
              value={input}
              onChange={event =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={event => {

                if (
                  event.key ===
                  'Enter'
                ) {
                  sendMessage();
                }

              }}
              placeholder="Pídele algo a Aurora..."
            />

            <button
              onClick={sendMessage}
              disabled={loading}
            >
              ➤
            </button>

          </div>

        </div>

      )}

    </>
  );
};
