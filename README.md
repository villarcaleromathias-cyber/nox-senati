# NOX · Agenda SENATI

Proyecto unido con React por CDN, Express, Aurora IA, Google Drive y Firebase.

## Estructura

- `index.html`: carga React, Firebase y todos los componentes.
- `js/app.js`: inicio de sesión de Google, navegación y sincronización con Firestore.
- `js/*.js`: calendario, clases, exámenes, parciales, entregables, cursos y Aurora.
- `css/styles.css`: diseño adaptable para computadora y celular.
- `server.js`: Aurora y subida de materiales a Google Drive.
- `firestore.rules`: privacidad de datos por usuario.
- `.env.example`: variables privadas del servidor.

## Configuración obligatoria en Firebase

1. En Authentication, habilita el proveedor **Google**.
2. En Authentication > Settings > Authorized domains, añade tu dominio de Render.
3. Crea Firestore Database.
4. Copia el contenido de `firestore.rules` en Firestore > Rules y publícalo.

La configuración web de Firebase incluida en `app.js` identifica el proyecto y puede estar en el frontend. Las claves privadas de Groq, Google OAuth y el refresh token deben permanecer únicamente en las variables de entorno del servidor.

## Ejecutar

```bash
npm install
npm start
```

Abre `http://localhost:3000`.

## Imágenes

Las imágenes remotas del acceso y las tarjetas proceden de Unsplash. La aplicación conserva un degradado oscuro para que el texto siga siendo legible si alguna imagen tarda en cargar.
