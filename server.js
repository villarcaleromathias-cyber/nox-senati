const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Soporte para carga de fotos/archivos en base64 hasta 20MB
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// Endpoint seguro para conectar Aurora IA con Groq API (Texto e Imágenes)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image, fileData, history } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'La clave GROQ_API_KEY no está configurada en las variables de Render.' });
    }

    // Selección de modelo (Visión si hay imagen, Llama 3.3 Versatile para texto)
    const model = image ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    let userContent = [];
    if (message) {
      userContent.push({ type: 'text', text: message });
    }
    if (fileData) {
      userContent.push({ type: 'text', text: `[Contenido del archivo adjunto ${fileData.name}]:\n${fileData.content}` });
    }
    if (image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: image }
      });
    }

    const messages = [
      {
        role: 'system',
        content: 'Eres Aurora, la IA asistente oficial de NOX Agenda SENATI. Tienes acceso para leer imágenes, PDFs, clases y entregar datos. Responde siempre de forma ejecutiva, amable, inteligente y clara.'
      },
      ...(history || []).map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: userContent.length === 1 && typeof userContent[0].text === 'string' ? userContent[0].text : userContent }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error en la respuesta de Groq API.' });
    }

    const reply = data.choices[0]?.message?.content || 'No pude procesar la respuesta.';
    res.json({ reply });
  } catch (err) {
    console.error('Error backend Aurora:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Guardar y Cargar estado/conversaciones en Google Drive
app.post('/api/drive/sync', (req, res) => {
  // Simulación de sincronización persistente con Google Drive
  const { items, chatHistory } = req.body;
  res.json({ status: 'success', message: 'Datos e historial de chat sincronizados con Google Drive.' });
});

app.get('/api/drive/sync', (req, res) => {
  res.json({ items: [], chatHistory: [] });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Nox iniciado en puerto ${PORT}`);
});
