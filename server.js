const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// Endpoint seguro para conectar Aurora IA con Groq API
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'La clave GROQ_API_KEY no está configurada en Render.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres Aurora, una IA asistente estudiantil para la agenda NOX de SENATI. Ayudas con el calendario, tareas, cursos, Drive y actividades académicas. Responde siempre de forma clara, amable y concisa.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error en la respuesta de Groq API.' });
    }

    const reply = data.choices[0]?.message?.content || 'No pude generar una respuesta.';
    res.json({ reply });
  } catch (err) {
    console.error('Error backend Aurora:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Endpoint base para Google Drive / Google Cloud Services
app.get('/api/drive/status', (req, res) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  res.json({ 
    status: configured ? 'activo' : 'pendiente',
    message: configured ? 'Servicio de Google Drive vinculado correctamente.' : 'Faltan credenciales de Google Cloud en Variables de Render.' 
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Nox iniciado correctamente en puerto ${PORT}`);
});
