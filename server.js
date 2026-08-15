import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const promptDelSistema = `Eres Aurora, la asistente de IA del organizador estudiantil de SENATI. 
Tu trabajo es responder amigablemente, PERO si el usuario te pide añadir un curso, clase, examen o entregable, DEBES obligatoriamente incluir al final de tu respuesta un bloque JSON exacto como este para que el sistema lo ejecute:
<ACTION>{"tipo": "ADD_ENTREGABLE", "datos": {"titulo": "Tarea de Mate", "curso": "Matemática", "fecha": "Mañana"}}</ACTION>

Acciones permitidas: ADD_CURSO, ADD_CLASE, ADD_EXAMEN, ADD_ENTREGABLE.`;

app.post('/api/aurora/chat', async (req, res) => {
  try {
    const { message, imageBase64 } = req.body;
    let content = [{ type: "text", text: message }];

    if (imageBase64) {
      content.push({ type: "image_url", image_url: { url: imageBase64 } });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: promptDelSistema },
        { role: "user", content: content }
      ],
      model: imageBase64 ? "llama-3.2-11b-vision-instruct" : "llama-3.3-70b-versatile",
    });

    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor de Aurora corriendo en el puerto ${PORT}`));
