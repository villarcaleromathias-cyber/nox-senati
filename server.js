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

// Google OAuth 2.0: usa exactamente los nombres configurados en Render.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  (process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/google/callback`
    : `http://localhost:${PORT}/api/google/callback`);

const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive'
];

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

function googleOAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

function googleAuth() {
  // Compatibilidad opcional con una cuenta de servicio, si algún día se agrega.
  const serviceAccountRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountRaw) {
    try {
      const credentials = safeJson(serviceAccountRaw);

      if (
        credentials?.client_email &&
        credentials?.private_key
      ) {
        return new google.auth.GoogleAuth({
          credentials,
          scopes: GOOGLE_DRIVE_SCOPES
        });
      }
    } catch (error) {
      console.error(
        'Credenciales de cuenta de servicio inválidas:',
        error.message
      );
    }
  }

  const oauth2Client = googleOAuthClient();

  if (!oauth2Client || !GOOGLE_REFRESH_TOKEN) {
    return null;
  }

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  return oauth2Client;
}

function getGoogleOAuth2Client() {
  const client = googleOAuthClient();

  if (!client) {
    throw new Error(
      'Faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en Render.'
    );
  }

  return client;
}

function getGoogleAuthorizationUrl() {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_DRIVE_SCOPES,
    include_granted_scopes: true
  });
}

function driveClient() {
  const auth = googleAuth();

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
   ACCIONES FLEXIBLES DE AURORA
   ================================================================ */

const AURORA_ACTIONS = [
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
];

const AURORA_TYPES = [
  'clase',
  'examen',
  'parcial',
  'entregable',
  ''
];

const AURORA_JSON_INSTRUCTIONS = `
RESPONDE SIEMPRE con JSON válido.

FORMATO EXACTO:

{
  "reply": "respuesta breve para el usuario",
  "actions": [
    {
      "action": "create",
      "type": "clase",
      "title": "",
      "courseName": "",
      "courseId": "",
      "date": "",
      "time": "",
      "endTime": "",
      "notes": "",
      "color": "",
      "id": "",
      "materialId": "",
      "item": {},
      "course": {}
    }
  ]
}

REGLAS IMPORTANTES:

1. "actions" SIEMPRE debe ser un array.
2. Una sola petición puede contener MUCHAS acciones.
3. Separa cada intención del usuario en una acción independiente.
4. Si el usuario pide varios cursos, genera una acción "create_course" por cada curso.
5. Si pide varios eventos, genera una acción "create" por cada evento.
6. Si combina cursos + clases + exámenes + parciales + entregables, genera todas las acciones.
7. No agrupes varias entidades dentro de una sola acción.
8. No inventes IDs.
9. Si no conoces un dato, usa una cadena vacía.
10. Para un curso nuevo usa "create_course" y coloca sus datos en "course".
11. Para una clase usa "create" + type "clase".
12. Para un examen usa "create" + type "examen".
13. Para un parcial usa "create" + type "parcial".
14. Para un entregable usa "create" + type "entregable".
15. Para editar un evento usa "update".
16. Para eliminar un evento usa "delete".
17. Para completar un evento usa "complete".
18. Para editar un curso usa "update_course".
19. Para eliminar un curso usa "delete_course".
20. Para eliminar un material usa "delete_material".
21. Para consultar pendientes usa "list".
22. Para ayuda usa "help".
23. Interpreta lenguaje natural, abreviaturas, errores ortográficos, comas, "y", "además", "también", "por cierto", listas separadas por comas y frases largas.
24. Comprende fechas naturales como "hoy", "mañana", "pasado mañana", "el lunes", "este viernes", "la próxima semana", siempre que puedan resolverse con seguridad usando la fecha actual que aparece en el contexto.
25. Comprende horas como "a las ocho", "8am", "8:00", "de 8 a 10", "en la tarde", etc.
26. Comprende expresiones de acción como "agrégame", "añade", "pon", "crea", "registra", "anota", "apunta", "programa".
27. Comprende "borra", "quita", "elimina", "saca".
28. Comprende "cambia", "edita", "modifica", "corrige", "actualiza".
29. Comprende "terminé", "he terminado", "marca como hecho", "completado".
30. Si el usuario da una lista, interpreta cada elemento como una entidad separada cuando el contexto lo indique.
31. Si el usuario mezcla varias acciones en una oración, conserva el orden lógico de las acciones.
32. No inventes datos faltantes; deja el campo vacío y deja que el backend conserve el dato anterior cuando corresponda.
33. "reply" debe ser breve y en español.
34. Nunca devuelvas Markdown dentro de "reply".
`;

function sanitizeAuroraAction(action = {}) {

  const raw =
    action &&
    typeof action === 'object'
      ? action
      : {};

  const normalizedAction =
    String(
      raw.action || 'none'
    )
      .trim()
      .toLowerCase();

  const normalizedType =
    String(
      raw.type || ''
    )
      .trim()
      .toLowerCase();

  return {

    action:
      AURORA_ACTIONS.includes(
        normalizedAction
      )
        ? normalizedAction
        : 'none',

    type:
      AURORA_TYPES.includes(
        normalizedType
      )
        ? normalizedType
        : '',

    title:
      raw.title == null
        ? ''
        : String(
            raw.title
          ).trim(),

    courseName:
      raw.courseName == null
        ? ''
        : String(
            raw.courseName
          ).trim(),

    courseId:
      raw.courseId == null
        ? ''
        : String(
            raw.courseId
          ).trim(),

    date:
      raw.date == null
        ? ''
        : String(
            raw.date
          ).trim(),

    time:
      raw.time == null
        ? ''
        : String(
            raw.time
          ).trim(),

    endTime:
      raw.endTime == null
        ? ''
        : String(
            raw.endTime
          ).trim(),

    notes:
      raw.notes == null
        ? ''
        : String(
            raw.notes
          ),

    color:
      raw.color == null
        ? ''
        : String(
            raw.color
          ).trim(),

    id:
      raw.id == null
        ? ''
        : String(
            raw.id
          ).trim(),

    materialId:
      raw.materialId == null
        ? ''
        : String(
            raw.materialId
          ).trim(),

    item:
      raw.item &&
      typeof raw.item === 'object' &&
      !Array.isArray(raw.item)
        ? raw.item
        : {},

    course:
      raw.course &&
      typeof raw.course === 'object' &&
      !Array.isArray(raw.course)
        ? raw.course
        : {}
  };
}

function extractAuroraActions(
  parsed = {}
) {

  if (
    parsed &&
    Array.isArray(
      parsed.actions
    )
  ) {

    return parsed.actions
      .map(
        sanitizeAuroraAction
      )
      .filter(
        action =>
          action.action !==
            'none' ||
          action.title
      );
  }

  if (
    parsed &&
    parsed.action
  ) {

    return [
      sanitizeAuroraAction(
        parsed
      )
    ];
  }

  return [];
}

async function applyActions(
  state = {},
  actions = [],
  save = true
) {

  let currentState = {

    items:
      Array.isArray(
        state.items
      )
        ? state.items
        : [],

    courses:
      Array.isArray(
        state.courses
      )
        ? state.courses
        : []
  };

  const applied = [];
  const errors = [];

  for (
    const rawAction
    of actions
  ) {

    const action =
      sanitizeAuroraAction(
        rawAction
      );

    if (
      !action.action ||
      action.action === 'none' ||
      action.action === 'help' ||
      action.action === 'list'
    ) {
      continue;
    }

    const result =
      applyAction(
        currentState,
        action
      );

    if (
      result.error
    ) {

      errors.push({
        action,
        error:
          result.error
      });

      continue;
    }

    if (
      result.changed
    ) {

      currentState = {

        items:
          result.items,

        courses:
          result.courses
      };

      applied.push({

        action,

        result:
          result.result
      });
    }
  }

  if (
    save &&
    applied.length > 0
  ) {

    try {

      await saveDrive({

        items:
          currentState.items,

        courses:
          currentState.courses
      });

    } catch (
      error
    ) {

      console.error(
        'Drive después de acciones Aurora:',
        error.message
      );
    }
  }

  return {

    ...currentState,

    applied,

    errors,

    changed:
      applied.length > 0
  };
}

async function askAurora(
  message,
  state,
  history = []
) {

  if (
    !GROQ_API_KEY
  ) {

    return {

      reply:
        'Aurora está en modo local. Configura GROQ_API_KEY para comprensión avanzada.',

      actions: []
    };
  }

  const currentDate =
    new Date().toISOString();

  const system = `
Eres Aurora, la inteligencia artificial de NOX Agenda SENATI.

Tu trabajo es entender lenguaje natural y convertir las intenciones del usuario en acciones ejecutables.

No eres un simple chatbot.
Puedes manipular la agenda.

Puedes administrar:

- cursos
- clases
- exámenes
- parciales
- entregables
- materiales
- horarios
- fechas
- relaciones entre cursos y eventos
- estados de tareas

Una petición puede contener una sola orden o MUCHAS órdenes.

Ejemplos:

"crea matemática, física e inglés"
=> 3 acciones create_course.

"crea matemática, borra física y mueve inglés al viernes"
=> 3 acciones.

"añade una clase de software mañana a las 8 y un examen de matemática el viernes a las 10"
=> 2 acciones.

"crea el curso de programación, una clase el lunes a las 8, un parcial el jueves y un entregable para el viernes"
=> 4 acciones.

Interpreta español natural aunque el usuario:
- escriba rápido,
- tenga errores ortográficos,
- use abreviaturas,
- cambie el orden de las palabras,
- use expresiones informales,
- combine varias órdenes con "y", "también", "además",
- utilice comas o listas.

No inventes información.

Fecha actual del servidor:
${currentDate}

Estado actual de NOX:
${JSON.stringify(
  state,
  null,
  2
)}

${AURORA_JSON_INSTRUCTIONS}
`;

  const messages = [

    {
      role: 'system',
      content:
        system
    },

    ...(history || [])
      .slice(-10)
      .map(
        historyItem => ({
          role:
            historyItem.sender ===
            'user'
              ? 'user'
              : 'assistant',

          content:
            historyItem.text
        })
      ),

    {
      role: 'user',
      content:
        message
    }
  ];

  const body = {

    model:
      GROQ_MODEL,

    messages,

    temperature:
      0.2,

    response_format: {

      type:
        'json_object'
    }
  };

  const response =
    await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {

        method:
          'POST',

        headers: {

          Authorization:
            `Bearer ${GROQ_API_KEY}`,

          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify(
            body
          )
      }
    );

  const data =
    await response.json();

  if (
    !response.ok
  ) {

    throw new Error(
      data.error?.message ||
      'Error en Groq.'
    );
  }

  let generated =
    data.choices?.[0]
      ?.message
      ?.content ||
    '{}';

  let parsed;

  try {

    parsed =
      JSON.parse(
        generated
      );

  } catch (
    error
  ) {

    console.error(
      'JSON inválido generado por Aurora:',
      generated
    );

    throw new Error(
      'Aurora generó una respuesta que no tiene formato JSON válido.'
    );
  }

  let actions =
    extractAuroraActions(
      parsed
    );

  if (
    !Array.isArray(
      actions
    )
  ) {

    actions = [];
  }

  return {

    reply:
      typeof parsed.reply ===
        'string'
        ? parsed.reply
        : 'Entendido.',

    actions,

    /*
     * Compatibilidad con el
     * Aurora.js antiguo.
     */

    action:
      actions.length > 0
        ? actions[0]
        : {
            action:
              'none'
          }
  };
}

/* ================================================================
   GOOGLE OAUTH 2.0
   ================================================================ */

app.get('/api/google/status', (req, res) => {
  res.json({
    configured: Boolean(
      GOOGLE_CLIENT_ID &&
      GOOGLE_CLIENT_SECRET
    ),
    authorized: Boolean(
      GOOGLE_CLIENT_ID &&
      GOOGLE_CLIENT_SECRET &&
      GOOGLE_REFRESH_TOKEN
    ),
    redirectUri: GOOGLE_REDIRECT_URI,
    driveReady: Boolean(googleAuth())
  });
});

app.get('/api/google/auth', (req, res) => {
  try {
    const url = getGoogleAuthorizationUrl();

    res.redirect(url);
  } catch (error) {
    res.status(500).send(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>NOX - Configuración de Google Drive</title>
        <style>
          body{font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:40px;line-height:1.6}
          .box{max-width:760px;margin:auto;background:#18181b;border:1px solid #3f3f46;border-radius:18px;padding:28px}
          code{background:#09090b;padding:3px 6px;border-radius:6px}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>NOX · Google Drive</h1>
          <p>${String(error.message).replace(/</g, '&lt;')}</p>
        </div>
      </body>
      </html>
    `);
  }
});

app.get('/api/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      throw new Error(
        'Google no devolvió el código de autorización.'
      );
    }

    const oauth2Client = getGoogleOAuth2Client();

    const { tokens } =
      await oauth2Client.getToken(code);

    const refreshToken =
      tokens.refresh_token || '';

    if (!refreshToken) {
      throw new Error(
        'Google no devolvió un refresh token. Vuelve a autorizar con prompt=consent o revoca el acceso anterior y repite el proceso.'
      );
    }

    res.send(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>NOX · Google Drive conectado</title>
        <style>
          body{font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:24px;line-height:1.6}
          .box{max-width:900px;margin:0 auto;background:#18181b;border:1px solid #3f3f46;border-radius:18px;padding:28px}
          .token{word-break:break-all;background:#09090b;border:1px solid #27272a;padding:16px;border-radius:12px}
          .warn{color:#fbbf24}
          button{background:#7c3aed;color:#fff;border:0;border-radius:10px;padding:12px 16px;cursor:pointer;font-weight:700}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>✅ Google Drive autorizado</h1>
          <p>La autorización funcionó. Ahora copia este <strong>refresh token</strong> y créalo en Render como variable:</p>
          <p><code>GOOGLE_REFRESH_TOKEN</code></p>
          <div class="token" id="token"></div>
          <br>
          <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent)">Copiar token</button>
          <p class="warn">No publiques este token ni lo subas a GitHub.</p>
          <p>Después de guardarlo en Render, haz un nuevo deploy. El servidor podrá guardar y cargar cursos, clases, exámenes, parciales, entregables y PDFs de Google Drive.</p>
        </div>
        <script>
          document.getElementById('token').textContent = ${JSON.stringify(refreshToken)};
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Google OAuth callback:', error);

    res.status(500).send(`
      <!doctype html>
      <html lang="es">
      <head><meta charset="utf-8"><title>NOX - Error Google</title></head>
      <body style="font-family:Arial;background:#09090b;color:#fff;padding:40px">
        <h1>❌ Error conectando Google Drive</h1>
        <p>${String(error.message).replace(/</g, '&lt;')}</p>
        <p>Revisa el redirect URI y vuelve a intentar desde <code>/api/google/auth</code>.</p>
      </body>
      </html>
    `);
  }
});

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

      googleOAuth:
        Boolean(
          GOOGLE_CLIENT_ID &&
          GOOGLE_CLIENT_SECRET
        ),

      googleAuthorized:
        Boolean(
          GOOGLE_CLIENT_ID &&
          GOOGLE_CLIENT_SECRET &&
          GOOGLE_REFRESH_TOKEN
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
  async (
    req,
    res
  ) => {

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

        return res
          .status(400)
          .json({

            error:
              'No recibí ningún mensaje o archivo.'
          });
      }

      if (
        message
      ) {

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

        actions: [],

        action: {
          action:
            'none'
        }
      });

    } catch (
      error
    ) {

      console.error(
        'Aurora:',
        error
      );

      res
        .status(500)
        .json({

          error:
            error.message ||
            'Error interno de Aurora.'
        });
    }
  }
);

/* ================================================================
   APLICAR UNA O VARIAS ACCIONES DE AURORA
   ================================================================ */

app.post(
  '/api/assistant/apply',
  async (
    req,
    res
  ) => {

    try {

      const state =
        req.body.state || {

          items: [],

          courses: []
        };

      let actions = [];

      if (
        Array.isArray(
          req.body.actions
        )
      ) {

        actions =
          req.body.actions;

      } else if (
        req.body.action
      ) {

        actions = [
          req.body.action
        ];
      }

      if (
        actions.length ===
        0
      ) {

        return res.json({

          items:
            state.items || [],

          courses:
            state.courses || [],

          applied: [],

          errors: [],

          changed:
            false,

          message:
            'No había acciones que ejecutar.'
        });
      }

      const result =
        await applyActions(

          state,

          actions,

          true
        );

      let message;

      if (
        result.applied.length ===
          0 &&
        result.errors.length >
          0
      ) {

        message =
          result.errors
            .map(
              error =>
                error.error
            )
            .join(
              ' · '
            );

      } else if (
        result.applied.length ===
        1
      ) {

        message =
          'Cambio aplicado correctamente.';

      } else {

        message =
          `${result.applied.length} cambios aplicados correctamente.`;
      }

      if (
        result.errors.length >
        0
      ) {

        message +=
          ` ${result.errors.length} acción(es) no pudieron aplicarse.`;
      }

      res.json({

        items:
          result.items,

        courses:
          result.courses,

        applied:
          result.applied,

        errors:
          result.errors,

        changed:
          result.changed,

        message
      });

    } catch (
      error
    ) {

      console.error(
        'Error aplicando acciones Aurora:',
        error
      );

      res
        .status(500)
        .json({

          error:
            error.message ||
            'No se pudieron aplicar las acciones.'
        });
    }
  }
);

/* ================================================================
   DRIVE SYNC
   ================================================================ */

app.post(
  '/api/drive/sync',
  async (
    req,
    res
  ) => {

    try {
      
      // Aseguramos que el backend reciba explícitamente items, courses y chatHistory
      const payload = {
        items: req.body.items || [],
        courses: req.body.courses || [],
        chatHistory: req.body.chatHistory || []
      };

      const result =
        await saveDrive(
          payload
        );

      res.json({

        status:
          'success',

        drive:
          result.enabled,

        message:
          result.enabled

            ? 'Agenda sincronizada con Google Drive (items y courses).'

            : 'Agenda guardada localmente; Google Drive no está configurado.'
      });

    } catch (
      error
    ) {

      res
        .status(500)
        .json({

          error:
            'No se pudo sincronizar con Google Drive.'
        });
    }
  }
);

app.get(
  '/api/drive/sync',
  async (
    req,
    res
  ) => {

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

    } catch (
      error
    ) {

      res
        .status(500)
        .json({

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
  async (
    req,
    res
  ) => {

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

        return res
          .status(400)
          .json({

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

      if (
        !result.enabled
      ) {

        return res
          .status(503)
          .json(
            result
          );
      }

      res.json(
        result
      );

    } catch (
      error
    ) {

      console.error(
        'Upload Drive:',
        error
      );

      res
        .status(500)
        .json({

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
  (
    req,
    res
  ) => {

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
    courses, // Añadido para asegurar consistencia en código legacy
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
    courses: [], // Añadido para asegurar consistencia en código legacy
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
