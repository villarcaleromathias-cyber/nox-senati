const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { google } = require('googleapis');

require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

app.use(cors());

app.use(express.json({
  limit: '60mb'
}));

app.use(express.urlencoded({
  limit: '60mb',
  extended: true
}));

app.use(express.static(path.join(__dirname)));

const safeJson = (value, fallback = null) => {
  try {
    return typeof value === 'string'
      ? JSON.parse(value)
      : value;
  } catch {
    return fallback;
  }
};

const uid = () => crypto.randomUUID();

/* ================================================================
   NORMALIZACIÓN
   ================================================================ */

function normalizeItem(item = {}) {
  return {
    id: item.id || uid(),
    type: item.type || 'clase',
    title: String(item.title || 'Sin título'),

    date:
      item.date ||
      new Date().toISOString().slice(0, 10),

    time: item.time || '',
    endTime: item.endTime || '',

    courseId: item.courseId || '',
    courseName: item.courseName || '',

    notes: item.notes || '',

    status: item.status || 'pendiente',

    color: item.color || '',

    createdAt:
      item.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}

function normalizeCourse(course = {}) {
  return {
    id: course.id || uid(),

    name: String(
      course.name || 'Nuevo curso'
    ),

    teacher: course.teacher || '',
    room: course.room || '',

    color:
      course.color ||
      '#8b5cf6',

    schedule:
      Array.isArray(course.schedule)
        ? course.schedule
        : [],

    materials:
      Array.isArray(course.materials)
        ? course.materials
        : [],

    notes:
      course.notes || '',

    createdAt:
      course.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}

function findCourse(courses, query = '') {
  const search =
    String(query)
      .toLowerCase()
      .trim();

  if (!search) {
    return null;
  }

  return (
    courses.find(
      course =>
        course.id === query ||
        course.name.toLowerCase() === search
    ) ||
    courses.find(
      course =>
        course.name
          .toLowerCase()
          .includes(search)
    )
  );
}

/* ================================================================
   ACCIONES DE AURORA
   ================================================================ */

function applyAction(state = {}, action = {}) {

  let items =
    (state.items || [])
      .map(normalizeItem);

  let courses =
    (state.courses || [])
      .map(normalizeCourse);

  const typeMap = {
    clase: 'clase',
    clases: 'clase',
    examen: 'examen',
    parcial: 'parcial',
    entregable: 'entregable',
    trabajo: 'entregable'
  };

  const kind =
    String(
      action.action || 'none'
    ).toLowerCase();

  /* --------------------------------------------------------------
     CREAR CURSO
     -------------------------------------------------------------- */

  if (kind === 'create_course') {

    const course =
      normalizeCourse(
        action.course || {
          name: action.title,
          color: action.color
        }
      );

    courses.push(course);

    return {
      items,
      courses,
      result: course,
      changed: true
    };
  }

  /* --------------------------------------------------------------
     EDITAR CURSO
     -------------------------------------------------------------- */

  if (kind === 'update_course') {

    const course =
      findCourse(
        courses,
        action.courseId ||
        action.courseName ||
        action.title
      );

    if (!course) {
      return {
        items,
        courses,
        error: 'No encontré ese curso.',
        changed: false
      };
    }

    Object.assign(
      course,
      action.course || {}
    );

    course.updatedAt =
      new Date().toISOString();

    return {
      items,
      courses,
      result: course,
      changed: true
    };
  }

  /* --------------------------------------------------------------
     ELIMINAR CURSO
     -------------------------------------------------------------- */

  if (kind === 'delete_course') {

    const course =
      findCourse(
        courses,
        action.courseId ||
        action.courseName ||
        action.title
      );

    if (!course) {
      return {
        items,
        courses,
        error: 'No encontré ese curso.',
        changed: false
      };
    }

    courses =
      courses.filter(
        item => item.id !== course.id
      );

    items =
      items.map(item =>
        item.courseId === course.id
          ? {
              ...item,
              courseId: '',
              courseName: ''
            }
          : item
      );

    return {
      items,
      courses,
      result: course,
      changed: true
    };
  }

  /* --------------------------------------------------------------
     CREAR EVENTO
     -------------------------------------------------------------- */

  if (kind === 'create') {

    const course =
      findCourse(
        courses,
        action.courseId ||
        action.courseName
      );

    const item =
      normalizeItem({
        ...(action.item || {}),

        type:
          typeMap[action.type] ||
          'clase',

        title:
          action.item?.title ||
          action.title,

        date:
          action.item?.date ||
          action.date,

        time:
          action.item?.time ||
          action.time,

        endTime:
          action.item?.endTime ||
          action.endTime,

        courseId:
          action.item?.courseId ||
          course?.id ||
          action.courseId ||
          '',

        courseName:
          action.item?.courseName ||
          course?.name ||
          action.courseName ||
          '',

        notes:
          action.item?.notes ||
          action.notes ||
          ''
      });

    items.push(item);

    return {
      items,
      courses,
      result: item,
      changed: true
    };
  }

  /* --------------------------------------------------------------
     EDITAR / COMPLETAR EVENTO
     -------------------------------------------------------------- */

  if (
    kind === 'update' ||
    kind === 'complete'
  ) {

    const target =
      action.id
        ? items.find(
            item =>
              item.id === action.id
          )
        : items.find(
            item =>
              (
                action.title &&
                item.title
                  .toLowerCase()
                  .includes(
                    String(
                      action.title
                    ).toLowerCase()
                  )
              ) ||
              (
                action.courseName &&
                item.courseName
                  .toLowerCase()
                  .includes(
                    String(
                      action.courseName
                    ).toLowerCase()
                  )
              )
          );

    if (!target) {
      return {
        items,
        courses,
        error:
          'No encontré el evento que quieres editar.',
        changed: false
      };
    }

    Object.assign(
      target,
      action.item || {}
    );

    if (kind === 'complete') {
      target.status =
        'completado';
    }

    target.updatedAt =
      new Date().toISOString();

    return {
      items,
      courses,
      result: target,
      changed: true
    };
  }

  /* --------------------------------------------------------------
     ELIMINAR EVENTO
     -------------------------------------------------------------- */

  if (kind === 'delete') {

    const before =
      items.length;

    items =
      items.filter(item => {

        if (action.id) {
          return item.id !== action.id;
        }

        return !(
          (
            action.title &&
            item.title
              .toLowerCase()
              .includes(
                String(
                  action.title
                ).toLowerCase()
              )
          ) ||
          (
            action.courseName &&
            item.courseName
              .toLowerCase()
              .includes(
                String(
                  action.courseName
                ).toLowerCase()
              )
          )
        );
      });

    return {
      items,
      courses,
      result: {
        deleted:
          before - items.length
      },
      changed:
        before !== items.length
    };
  }

  /* --------------------------------------------------------------
     ELIMINAR MATERIAL
     -------------------------------------------------------------- */

  if (
    kind ===
    'delete_material'
  ) {

    const course =
      findCourse(
        courses,
        action.courseId ||
        action.courseName
      );

    if (!course) {
      return {
        items,
        courses,
        error:
          'No encontré ese curso.',
        changed: false
      };
    }

    course.materials =
      (course.materials || [])
        .filter(
          material =>
            material.id !==
            action.materialId
        );

    course.updatedAt =
      new Date().toISOString();

    return {
      items,
      courses,
      result: course,
      changed: true
    };
  }

  return {
    items,
    courses,
    changed: false
  };
}

/* ================================================================
   GOOGLE DRIVE
   ================================================================ */

function googleAuth() {

  const raw =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    return null;
  }

  try {

    const credentials =
      safeJson(raw);

    if (
      !credentials?.client_email ||
      !credentials?.private_key
    ) {
      return null;
    }

    return new google.auth.GoogleAuth({
      credentials,

      scopes: [
        'https://www.googleapis.com/auth/drive'
      ]
    });

  } catch (error) {

    console.error(
      'Credenciales Google inválidas:',
      error.message
    );

    return null;
  }
}

function driveClient() {

  const auth =
    googleAuth();

  return auth
    ? google.drive({
        version: 'v3',
        auth
      })
    : null;
}

async function ensureFolder(
  drive,
  name,
  parentId = null
) {

  const parent =
    parentId
      ? ` and '${parentId}' in parents`
      : '';

  const q =
    `name = '${name.replace(
      /'/g,
      "\\'"
    )}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parent}`;

  const result =
    await drive.files.list({
      q,
      fields:
        'files(id,name)',
      pageSize: 1
    });

  if (
    result.data.files?.[0]
  ) {
    return result
      .data
      .files[0]
      .id;
  }

  const created =
    await drive.files.create({
      requestBody: {
        name,
        mimeType:
          'application/vnd.google-apps.folder',

        ...(parentId
          ? { parents: [parentId] }
          : {})
      },

      fields: 'id'
    });

  return created.data.id;
}

async function saveDrive(payload) {

  const drive =
    driveClient();

  if (!drive) {
    return {
      enabled: false
    };
  }

  const folder =
    DRIVE_FOLDER_ID ||
    await ensureFolder(
      drive,
      'NOX Agenda SENATI'
    );

  const q =
    `name = 'nox-agenda-data.json' and '${folder}' in parents and trashed = false`;

  const found =
    await drive.files.list({
      q,
      fields:
        'files(id,name)',
      pageSize: 1
    });

  const temp =
    path.join(
      os.tmpdir(),
      `nox-${Date.now()}.json`
    );

  fs.writeFileSync(
    temp,
    JSON.stringify(
      {
        ...payload,
        savedAt:
          new Date().toISOString()
      },
      null,
      2
    )
  );

  const media = {
    mimeType:
      'application/json',
    body:
      fs.createReadStream(
        temp
      )
  };

  let result;

  if (
    found.data.files?.[0]
  ) {

    result =
      await drive.files.update({
        fileId:
          found.data
            .files[0]
            .id,

        media,

        fields:
          'id,name,modifiedTime'
      });

  } else {

    result =
      await drive.files.create({
        requestBody: {
          name:
            'nox-agenda-data.json',

          parents: [folder],

          mimeType:
            'application/json'
        },

        media,

        fields:
          'id,name,modifiedTime'
      });
  }

  fs.unlinkSync(temp);

  return {
    enabled: true,
    file: result.data
  };
}

async function loadDrive() {

  const drive =
    driveClient();

  if (!drive) {
    return {
      enabled: false,
      data: null
    };
  }

  const folder =
    DRIVE_FOLDER_ID ||
    await ensureFolder(
      drive,
      'NOX Agenda SENATI'
    );

  const q =
    `name = 'nox-agenda-data.json' and '${folder}' in parents and trashed = false`;

  const result =
    await drive.files.list({
      q,
      fields:
        'files(id,name)',
      pageSize: 1
    });

  if (
    !result.data.files?.[0]
  ) {
    return {
      enabled: true,
      data: null
    };
  }

  const data =
    await drive.files.get({
      fileId:
        result.data
          .files[0]
          .id,

      alt: 'media'
    });

  return {
    enabled: true,
    data: data.data
  };
}

async function uploadDrive({
  name,
  mimeType,
  base64,
  courseName
}) {

  const drive =
    driveClient();

  if (!drive) {
    return {
      enabled: false,
      error:
        'Google Drive no está configurado en el servidor.'
    };
  }

  const root =
    DRIVE_FOLDER_ID ||
    await ensureFolder(
      drive,
      'NOX Agenda SENATI'
    );

  const folder =
    courseName
      ? await ensureFolder(
          drive,
          courseName,
          root
        )
      : root;

  const clean =
    String(base64)
      .replace(
        /^data:[^;]+;base64,/,
        ''
      );

  const buffer =
    Buffer.from(
      clean,
      'base64'
    );

  const temp =
    path.join(
      os.tmpdir(),
      `nox-${Date.now()}-${name.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      )}`
    );

  fs.writeFileSync(
    temp,
    buffer
  );

  const result =
    await drive.files.create({
      requestBody: {
        name,
        parents: [folder]
      },

      media: {
        mimeType:
          mimeType ||
          'application/octet-stream',

        body:
          fs.createReadStream(temp)
      },

      fields:
        'id,name,mimeType,size,webViewLink,createdTime'
    });

  fs.unlinkSync(temp);

  return {
    enabled: true,
    file: result.data
  };
}

/* ================================================================
   ESQUEMA DE ACCIONES DE AURORA
   ================================================================ */

const SCHEMA = {
  type: 'object',

  additionalProperties: false,

  properties: {

    action: {
      type: 'string',

      enum: [
        'none',
        'help',
        'list',
        'create',
        'update',
        'delete',
        'complete',
        'create_course',
        'update_course',
        'delete_course',
        'delete_material'
      ]
    },

    type: {
      type: 'string',

      enum: [
        'clase',
        'examen',
        'parcial',
        'entregable',
        ''
      ]
    },

    title: {
      type: 'string'
    },

    courseName: {
      type: 'string'
    },

    courseId: {
      type: 'string'
    },

    date: {
      type: 'string'
    },

    time: {
      type: 'string'
    },

    endTime: {
      type: 'string'
    },

    notes: {
      type: 'string'
    },

    color: {
      type: 'string'
    },

    id: {
      type: 'string'
    },

    materialId: {
      type: 'string'
    },

    item: {
      type: 'object',
      additionalProperties: true
    },

    course: {
      type: 'object',
      additionalProperties: true
    }
  },

  required: [
    'action',
    'type',
    'title',
    'courseName',
    'courseId',
    'date',
    'time',
    'endTime',
    'notes',
    'color',
    'id',
    'materialId',
    'item',
    'course'
  ]
};

async function askAurora(
  message,
  state,
  history = []
) {

  if (!GROQ_API_KEY) {

    return {
      reply:
        'Aurora está en modo local. Configura GROQ_API_KEY para comprensión avanzada.',

      action: {
        action: 'none'
      }
    };
  }

  const system = `
Eres Aurora, asistente de NOX Agenda SENATI.

Entiende español natural y convierte peticiones en acciones.

Puedes:
- crear clases
- editar clases
- eliminar clases
- crear exámenes
- editar exámenes
- eliminar exámenes
- crear parciales
- editar parciales
- eliminar parciales
- crear entregables
- editar entregables
- eliminar entregables
- completar actividades
- crear cursos
- editar cursos
- eliminar cursos
- consultar pendientes

Vincula eventos con cursos cuando sea posible.

Fechas:
YYYY-MM-DD

Horas:
HH:MM

No inventes IDs.

Si falta una fecha inequívoca,
déjala vacía.

Si piden ayuda:
usa help.

Si piden consultar:
usa list.

No hagas cambios ambiguos.
`;

  const body = {

    model:
      GROQ_MODEL,

    messages: [

      {
        role: 'system',
        content: system
      },

      {
        role: 'system',

        content:
          `Estado actual:\n${JSON.stringify(
            state
          )}`
      },

      ...(history || [])
        .slice(-8)
        .map(historyItem => ({
          role:
            historyItem.sender === 'user'
              ? 'user'
              : 'assistant',

          content:
            historyItem.text
        })),

      {
        role: 'user',
        content: message
      }
    ],

    temperature: 0.1,

    response_format: {
      type: 'json_schema',

      json_schema: {
        name: 'nox_action',
        strict: true,
        schema: SCHEMA
      }
    }
  };

  const response =
    await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${GROQ_API_KEY}`,

          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify(body)
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.error?.message ||
      'Error en Groq.'
    );
  }

  const action =
    safeJson(
      data.choices?.[0]?.message?.content ||
        '{}',

      {
        action: 'none'
      }
    );

  return {
    reply: 'Entendido.',
    action
  };
}

/* ================================================================
   HEALTH
   ================================================================ */

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      ok: true,

      aurora:
        Boolean(
          GROQ_API_KEY
        ),

      drive:
        Boolean(
          googleAuth()
        ),

      model:
        GROQ_MODEL
    });
  }
);

/* ================================================================
   CHAT AURORA
   ================================================================ */

app.post(
  '/api/chat',
  async (req, res) => {

    try {

      const {
        message,
        image,
        fileData,
        history,
        state
      } = req.body;

      if (
        !message &&
        !image &&
        !fileData
      ) {

        return res.status(400).json({
          error:
            'No recibí ningún mensaje o archivo.'
        });
      }

      if (message) {

        const result =
          await askAurora(
            message,
            state || {
              items: [],
              courses: []
            },
            history
          );

        return res.json(
          result
        );
      }

      res.json({
        reply:
          'Recibí el archivo. Puedes pedirme que lo use en tu agenda cuando esté disponible como texto.',

        action: {
          action: 'none'
        }
      });

    } catch (error) {

      console.error(
        'Aurora:',
        error
      );

      res.status(500).json({
        error:
          error.message ||
          'Error interno de Aurora.'
      });
    }
  }
);

/* ================================================================
   APLICAR ACCIÓN DE AURORA
   ================================================================ */

app.post(
  '/api/assistant/apply',
  async (req, res) => {

    try {

      const result =
        applyAction(
          req.body.state || {},
          req.body.action || {}
        );

      if (result.changed) {

        try {

          await saveDrive({
            items:
              result.items,

            courses:
              result.courses,

            chatHistory:
              req.body.chatHistory || []
          });

        } catch (error) {

          console.error(
            'Drive:',
            error.message
          );
        }
      }

      res.json({
        ...result,

        message:
          result.error ||
          (
            result.changed
              ? 'Cambio aplicado correctamente.'
              : 'No hubo cambios.'
          )
      });

    } catch (error) {

      res.status(500).json({
        error:
          error.message ||
          'No se pudo aplicar la acción.'
      });
    }
  }
);

/* ================================================================
   DRIVE SYNC
   ================================================================ */

app.post(
  '/api/drive/sync',
  async (req, res) => {

    try {

      const result =
        await saveDrive(
          req.body
        );

      res.json({
        status:
          'success',

        drive:
          result.enabled,

        message:
          result.enabled
            ? 'Agenda sincronizada con Google Drive.'
            : 'Agenda guardada localmente; Google Drive no está configurado.'
      });

    } catch (error) {

      res.status(500).json({
        error:
          'No se pudo sincronizar con Google Drive.'
      });
    }
  }
);

app.get(
  '/api/drive/sync',
  async (req, res) => {

    try {

      const result =
        await loadDrive();

      res.json(
        result.data ||
        {
          items: [],
          courses: [],
          chatHistory: []
        }
      );

    } catch (error) {

      res.status(500).json({
        error:
          'No se pudo cargar la agenda desde Google Drive.'
      });
    }
  }
);

/* ================================================================
   SUBIDA DE PDF
   ================================================================ */

app.post(
  '/api/drive/upload',
  async (req, res) => {

    try {

      const {
        name,
        mimeType,
        base64,
        courseName
      } = req.body;

      if (
        !name ||
        !base64
      ) {

        return res.status(400).json({
          error:
            'Faltan datos del archivo.'
        });
      }

      const result =
        await uploadDrive({
          name,
          mimeType,
          base64,
          courseName
        });

      if (!result.enabled) {

        return res.status(503).json(
          result
        );
      }

      res.json(
        result
      );

    } catch (error) {

      console.error(
        'Upload Drive:',
        error
      );

      res.status(500).json({
        error:
          error.message ||
          'No se pudo subir el archivo.'
      });
    }
  }
);

/* ================================================================
   FRONTEND
   ================================================================ */

app.get(
  '*',
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        'index.html'
      )
    );
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Servidor Nox iniciado en puerto ${PORT}`
    );
  }
);

/* ================================================================
   NOX LEGACY SOURCE PRESERVED
   Código original que me enviaste, conservado.
   ================================================================ */

/*
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

    const {
      message,
      image,
      fileData,
      history
    } = req.body;

    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {

      return res.status(500).json({
        error:
          'La clave GROQ_API_KEY no está configurada en las variables de Render.'
      });
    }

    const model =
      image
        ? 'llama-3.2-11b-vision-preview'
        : 'llama-3.3-70b-versatile';

    let userContent = [];

    if (message) {

      userContent.push({
        type: 'text',
        text: message
      });
    }

    if (fileData) {

      userContent.push({
        type: 'text',
        text:
          `[Contenido del archivo adjunto ${fileData.name}]:\n${fileData.content}`
      });
    }

    if (image) {

      userContent.push({
        type: 'image_url',
        image_url: {
          url: image
        }
      });
    }

    const messages = [
      {
        role: 'system',
        content:
          'Eres Aurora, la IA asistente oficial de NOX Agenda SENATI. Tienes acceso para leer imágenes, PDFs, clases y entregar datos. Responde siempre de forma ejecutiva, amable, inteligente y clara.'
      },

      ...(history || []).map(
        h => ({
          role:
            h.sender === 'user'
              ? 'user'
              : 'assistant',

          content:
            h.text
        })
      ),

      {
        role: 'user',
        content:
          userContent.length === 1 &&
          typeof userContent[0].text === 'string'
            ? userContent[0].text
            : userContent
      }
    ];

    const response =
      await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            'Authorization':
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              model,
              messages,
              temperature: 0.7
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      return res
        .status(response.status)
        .json({
          error:
            data.error?.message ||
            'Error en la respuesta de Groq API.'
        });
    }

    const reply =
      data.choices[0]?.message?.content ||
      'No pude procesar la respuesta.';

    res.json({
      reply
    });

  } catch (err) {

    console.error(
      'Error backend Aurora:',
      err
    );

    res.status(500).json({
      error:
        'Error interno del servidor.'
    });
  }
});

// Guardar y cargar estado/conversaciones en Google Drive
app.post('/api/drive/sync', (req, res) => {

  const {
    items,
    chatHistory
  } = req.body;

  res.json({
    status:
      'success',

    message:
      'Datos e historial de chat sincronizados con Google Drive.'
  });
});

app.get('/api/drive/sync', (req, res) => {

  res.json({
    items: [],
    chatHistory: []
  });
});

app.get('*', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'index.html'
    )
  );
});

app.listen(
  PORT,
  () => {
    console.log(
      `Servidor Nox iniciado en puerto ${PORT}`
    );
  }
});
*/
