const {
  useState
} = React;

window.CursosSection =
function CursosSection({
  courses = [],
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onUploadMaterial,
  onDeleteMaterial
}) {

  const palette = [
    '#8b5cf6',
    '#3b82f6',
    '#06b6d4',
    '#10b981',
    '#eab308',
    '#f97316',
    '#ef4444',
    '#ec4899'
  ];

  const defaultCourse = {
    name: '',
    teacher: '',
    room: '',
    color: '#8b5cf6',
    notes: ''
  };

  const [
    open,
    setOpen
  ] = useState(false);

  const [
    editing,
    setEditing
  ] = useState(null);

  const [
    form,
    setForm
  ] = useState(
    defaultCourse
  );

  const [
    expanded,
    setExpanded
  ] = useState(null);

  const [
    busy,
    setBusy
  ] = useState(false);

  const openEditor =
    course => {

      setEditing(
        course || null
      );

      setForm(
        course
          ? {
              ...course
            }
          : {
              ...defaultCourse
            }
      );

      setOpen(true);
    };

  const saveCourse =
    () => {

      if (
        !form.name.trim()
      ) {

        alert(
          'Escribe el nombre del curso.'
        );

        return;
      }

      if (editing) {

        onUpdateCourse(
          editing.id,
          form
        );

      } else {

        onAddCourse({
          ...form,

          color:
            form.color ||
            palette[
              courses.length %
              palette.length
            ]
        });
      }

      setOpen(false);
    };

  const upload =
    async (
      event,
      course
    ) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        file.type !==
        'application/pdf'
      ) {

        alert(
          'Selecciona un PDF.'
        );

        event.target.value =
          '';

        return;
      }

      if (
        file.size >
        45 * 1024 * 1024
      ) {

        alert(
          'El PDF supera 45 MB.'
        );

        event.target.value =
          '';

        return;
      }

      setBusy(true);

      try {

        const base64 =
          await new Promise(
            (
              resolve,
              reject
            ) => {

              const reader =
                new FileReader();

              reader.onload =
                () =>
                  resolve(
                    reader.result
                  );

              reader.onerror =
                reject;

              reader.readAsDataURL(
                file
              );
            }
          );

        await onUploadMaterial(
          course.id,
          file,
          base64
        );

      } catch (error) {

        alert(
          error.message
        );

      } finally {

        setBusy(false);

        event.target.value =
          '';
      }
    };

  return (

    <div className="
      space-y-5
    ">

      <div className="
        card-nox
        p-4 sm:p-6
        rounded-3xl
        flex
        flex-col
        sm:flex-row
        justify-between
        gap-4
      ">

        <div>

          <h2 className="
            text-xl
            sm:text-2xl
            font-bold
          ">
            Cursos y Materiales
          </h2>

          <p className="
            text-xs
            text-zinc-500
          ">
            Cada curso tiene
            color, información
            y materiales propios.
          </p>

        </div>

        <button
          className="
            nox-primary
          "
          onClick={() =>
            openEditor()
          }
        >
          + Añadir curso
        </button>

      </div>

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        gap-4
      ">

        {
          courses.map(
            course => (

              <div
                key={course.id}
                className="
                  card-nox
                  rounded-3xl
                  overflow-hidden
                "
                style={{
                  borderTop:
                    `4px solid ${course.color}`
                }}
              >

                <div className="
                  p-5
                ">

                  <div className="
                    flex
                    justify-between
                    gap-3
                  ">

                    <div>

                      <h3 className="
                        font-black
                        text-lg
                      ">
                        {course.name}
                      </h3>

                      <p className="
                        text-xs
                        text-zinc-500
                      ">

                        {
                          course.teacher ||
                          'Sin docente'
                        }

                        {
                          course.room
                            ? ` · ${course.room}`
                            : ''
                        }

                      </p>

                    </div>

                    <div
                      className="
                        w-8
                        h-8
                        rounded-full
                      "

                      style={{
                        background:
                          course.color
                      }}
                    />

                  </div>

                  <div className="
                    flex
                    flex-wrap
                    gap-2
                    mt-4
                  ">

                    <button
                      className="nox-btn"
                      onClick={() =>
                        openEditor(
                          course
                        )
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="
                        nox-btn
                        danger
                      "
                      onClick={() =>
                        onDeleteCourse(
                          course.id
                        )
                      }
                    >
                      Eliminar
                    </button>

                    <button
                      className="nox-btn"
                      onClick={() =>
                        setExpanded(
                          expanded ===
                          course.id
                            ? null
                            : course.id
                        )
                      }
                    >
                      {
                        expanded ===
                        course.id
                          ? 'Ocultar'
                          : 'Materiales'
                      }
                    </button>

                  </div>

                </div>

                {
                  expanded ===
                  course.id &&

                  <div className="
                    border-t
                    border-zinc-800
                    p-4
                    bg-zinc-950/50
                  ">

                    <div className="
                      flex
                      justify-between
                      items-center
                      mb-3
                    ">

                      <b className="
                        text-sm
                      ">
                        Materiales
                      </b>

                      <label className="
                        nox-primary
                        cursor-pointer
                        text-xs
                        px-3
                        py-2
                      ">
                        {
                          busy
                            ? 'Subiendo...'
                            : '+ PDF'
                        }

                        <input
                          type="file"
                          accept="
                            .pdf,
                            application/pdf
                          "
                          hidden
                          disabled={busy}
                          onChange={
                            event =>
                              upload(
                                event,
                                course
                              )
                          }
                        />

                      </label>

                    </div>

                    {
                      (
                        course.materials ||
                        []
                      ).map(
                        (
                          material,
                          index
                        ) => (

                          <div
                            key={
                              material.id ||
                              index
                            }

                            className="
                              flex
                              items-center
                              justify-between
                              gap-2
                              p-3
                              rounded-xl
                              bg-zinc-900
                              mb-2
                            "
                          >

                            <div className="
                              text-sm
                              truncate
                            ">
                              📄
                              {' '}
                              {
                                material.name ||
                                `PDF ${index + 1}`
                              }
                            </div>

                            <div className="
                              flex
                              gap-2
                              shrink-0
                            ">

                              {
                                material.webViewLink &&

                                <a
                                  className="
                                    nox-btn
                                    text-xs
                                  "
                                  href={
                                    material.webViewLink
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Abrir
                                </a>
                              }

                              <button
                                className="
                                  nox-btn
                                  danger
                                  text-xs
                                "
                                onClick={() =>
                                  onDeleteMaterial(
                                    course.id,
                                    material.id
                                  )
                                }
                              >
                                Eliminar
                              </button>

                            </div>

                          </div>

                        )
                      )
                    }

                    {
                      !(
                        course.materials ||
                        []
                      ).length &&

                      <p className="
                        text-xs
                        text-zinc-600
                      ">
                        Sube PDF 1,
                        PDF 2,
                        PDF 3…
                      </p>
                    }

                  </div>
                }

              </div>

            )
          )
        }

      </div>

      {
        !courses.length &&

        <div className="
          card-nox
          p-10
          rounded-3xl
          text-center
          text-zinc-500
        ">
          Crea tu primer curso
          para vincular clases,
          exámenes, parciales
          y entregables.
        </div>
      }

      {
        open &&

        <div
          className="
            modal-backdrop
          "
          onMouseDown={
            event => {

              if (
                event.target ===
                event.currentTarget
              ) {

                setOpen(false);
              }

            }
          }
        >

          <div className="
            modal-card
          ">

            <div className="
              flex
              justify-between
              mb-5
            ">

              <h3 className="
                text-xl
                font-black
              ">
                {
                  editing
                    ? 'Editar curso'
                    : 'Crear curso'
                }
              </h3>

              <button
                className="nox-icon"
                onClick={() =>
                  setOpen(false)
                }
              >
                ×
              </button>

            </div>

            <div className="
              space-y-3
            ">

              <label className="
                field-label
              ">
                Nombre

                <input
                  className="nox-input"
                  value={
                    form.name
                  }
                  onChange={
                    event =>
                      setForm({
                        ...form,
                        name:
                          event.target.value
                      })
                  }
                  placeholder="
                    Ingeniería de Software
                  "
                />

              </label>

              <div className="
                grid
                grid-cols-2
                gap-3
              ">

                <label className="
                  field-label
                ">
                  Docente

                  <input
                    className="nox-input"
                    value={
                      form.teacher ||
                      ''
                    }
                    onChange={
                      event =>
                        setForm({
                          ...form,
                          teacher:
                            event.target.value
                        })
                    }
                  />

                </label>

                <label className="
                  field-label
                ">
                  Aula

                  <input
                    className="nox-input"
                    value={
                      form.room ||
                      ''
                    }
                    onChange={
                      event =>
                        setForm({
                          ...form,
                          room:
                            event.target.value
                        })
                    }
                  />

                </label>

              </div>

              <label className="
                field-label
              ">
                Color

                <div className="
                  flex
                  flex-wrap
                  gap-2
                  mt-1
                ">

                  {
                    palette.map(
                      color => (

                        <button
                          type="button"
                          key={color}
                          onClick={() =>
                            setForm({
                              ...form,
                              color
                            })
                          }
                          className={
                            `w-9 h-9 rounded-full border-2 ${
                              form.color ===
                              color
                                ? 'border-white'
                                : 'border-transparent'
                            }`
                          }
                          style={{
                            background:
                              color
                          }}
                        />

                      )
                    )
                  }

                </div>

              </label>

              <label className="
                field-label
              ">
                Notas

                <textarea
                  className="nox-input"
                  value={
                    form.notes ||
                    ''
                  }
                  onChange={
                    event =>
                      setForm({
                        ...form,
                        notes:
                          event.target.value
                      })
                  }
                />

              </label>

              <button
                className="
                  w-full
                  nox-primary
                "
                onClick={
                  saveCourse
                }
              >
                {
                  editing
                    ? 'Guardar cambios'
                    : 'Crear curso'
                }
              </button>

            </div>

          </div>

        </div>
      }

    </div>
  );
};
