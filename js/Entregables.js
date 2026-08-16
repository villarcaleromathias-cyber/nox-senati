const {
  useState
} = React;

window.EntregablesSection =
function EntregablesSection({
  items = [],
  courses = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) {

  const [
    year,
    setYear
  ] = useState(
    new Date().getFullYear()
  );

  const [
    month,
    setMonth
  ] = useState(
    new Date().getMonth()
  );

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
  ] = useState({
    title: '',
    date: '',
    time: '23:59',
    courseId: '',
    notes: ''
  });

  const monthName =
    new Date(
      year,
      month
    ).toLocaleString(
      'es-ES',
      {
        month: 'long'
      }
    );

  const data =
    items.filter(
      item => {

        const date =
          new Date(
            item.date
          );

        return (
          item.type ===
            'entregable' &&
          date.getFullYear() ===
            year &&
          date.getMonth() ===
            month
        );
      }
    );

  const changeMonth =
    direction => {

      let nextMonth =
        month + direction;

      let nextYear =
        year;

      if (
        nextMonth > 11
      ) {
        nextMonth = 0;
        nextYear++;
      }

      if (
        nextMonth < 0
      ) {
        nextMonth = 11;
        nextYear--;
      }

      setMonth(
        nextMonth
      );

      setYear(
        nextYear
      );
    };

  const openEditor =
    item => {

      setEditing(
        item || null
      );

      setForm(
        item

          ? {
              ...item
            }

          : {
              title: '',
              date:
                new Date(
                  year,
                  month,
                  20
                )
                  .toISOString()
                  .slice(
                    0,
                    10
                  ),
              time: '23:59',
              courseId: '',
              notes: ''
            }
      );

      setOpen(true);
    };

  const save =
    () => {

      if (
        !form.title.trim() ||
        !form.date
      ) {

        alert(
          'Completa el trabajo y la fecha.'
        );

        return;
      }

      const course =
        courses.find(
          item =>
            item.id ===
            form.courseId
        );

      const item = {

        ...form,

        type:
          'entregable',

        courseName:
          course?.name ||
          '',

        color:
          course?.color ||
          '#eab308',

        status:
          editing?.status ||
          'pendiente'
      };

      if (editing) {

        onUpdateItem(
          editing.id,
          item
        );

      } else {

        onAddItem(
          item
        );
      }

      setOpen(false);
    };

  return (

    <div className="
      space-y-6
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
            capitalize
          ">
            Entregables
            {' · '}
            {monthName}
            {' '}
            {year}
          </h2>

          <p className="
            text-xs
            text-zinc-500
          ">
            Trabajos pendientes
            y fechas límite.
          </p>

        </div>

        <div className="
          flex
          gap-2
        ">

          <button
            className="nox-btn"
            onClick={() =>
              changeMonth(-1)
            }
          >
            ←
          </button>

          <button
            className="nox-btn"
            onClick={() =>
              changeMonth(1)
            }
          >
            →
          </button>

          <button
            className="
              nox-primary
            "
            onClick={() =>
              openEditor()
            }
          >
            + Nuevo trabajo
          </button>

        </div>

      </div>

      <div className="
        space-y-3
      ">

        {
          data.map(
            item => (

              <div
                key={item.id}
                className="
                  card-nox
                  p-4
                  rounded-2xl
                  flex
                  justify-between
                  gap-3
                "
              >

                <div>

                  <div className="
                    text-yellow-400
                    text-xs
                    font-bold
                  ">
                    Entrega:
                    {' '}
                    {item.date}
                    {' · '}
                    {
                      item.time ||
                      '23:59'
                    }
                  </div>

                  <b>
                    {item.title}
                  </b>

                  <p className="
                    text-xs
                    text-zinc-500
                  ">
                    {
                      item.courseName ||
                      'Sin curso'
                    }

                    {
                      item.notes
                        ? ` · ${item.notes}`
                        : ''
                    }
                  </p>

                </div>

                <div className="
                  flex
                  gap-2
                ">

                  <button
                    className="
                      nox-btn
                    "
                    onClick={() =>
                      openEditor(
                        item
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
                      onDeleteItem(
                        item.id
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
          !data.length &&
          <div className="
            card-nox
            p-8
            rounded-3xl
            text-center
            text-zinc-500
          ">
            No hay entregables
            este mes.
          </div>
        }

      </div>

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
                    ? 'Editar entregable'
                    : 'Nuevo entregable'
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
                Curso

                <select
                  className="nox-input"
                  value={
                    form.courseId
                  }
                  onChange={
                    event =>
                      setForm({
                        ...form,
                        courseId:
                          event.target.value
                      })
                  }
                >

                  <option value="">
                    Sin curso
                  </option>

                  {
                    courses.map(
                      course => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {course.name}
                        </option>
                      )
                    )
                  }

                </select>

              </label>

              <label className="
                field-label
              ">
                Título

                <input
                  className="nox-input"
                  value={
                    form.title
                  }
                  onChange={
                    event =>
                      setForm({
                        ...form,
                        title:
                          event.target.value
                      })
                  }
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
                  Fecha límite

                  <input
                    type="date"
                    className="nox-input"
                    value={
                      form.date
                    }
                    onChange={
                      event =>
                        setForm({
                          ...form,
                          date:
                            event.target.value
                        })
                    }
                  />

                </label>

                <label className="
                  field-label
                ">
                  Hora límite

                  <input
                    type="time"
                    className="nox-input"
                    value={
                      form.time
                    }
                    onChange={
                      event =>
                        setForm({
                          ...form,
                          time:
                            event.target.value
                        })
                    }
                  />

                </label>

              </div>

              <label className="
                field-label
              ">
                Notas

                <textarea
                  className="nox-input"
                  value={
                    form.notes
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
                onClick={save}
              >
                {
                  editing
                    ? 'Guardar cambios'
                    : 'Crear entregable'
                }
              </button>

            </div>

          </div>

        </div>
      }

    </div>
  );
};
