const {
  useState
} = React;

window.ClasesSection =
function ClasesSection({
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
    day,
    setDay
  ] = useState(null);

  const [
    editing,
    setEditing
  ] = useState(null);

  const [
    form,
    setForm
  ] = useState({
    title: '',
    courseId: '',
    time: '08:00',
    endTime: '10:00',
    notes: ''
  });

  const now =
    new Date();

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

  const classes =
    items.filter(item => {

      const date =
        new Date(
          item.date
        );

      return (
        item.type === 'clase' &&
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });

  const changeMonth =
    direction => {

      let nextMonth =
        month +
        direction;

      let nextYear =
        year;

      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }

      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear--;
      }

      setMonth(nextMonth);
      setYear(nextYear);
    };

  const openModal =
    (
      selectedDay,
      item = null
    ) => {

      setDay(
        selectedDay
      );

      setEditing(
        item
      );

      if (item) {

        setForm({
          title:
            item.title || '',

          courseId:
            item.courseId || '',

          time:
            item.time ||
            '08:00',

          endTime:
            item.endTime ||
            '10:00',

          notes:
            item.notes || ''
        });

      } else {

        setForm({
          title: '',
          courseId: '',
          time: '08:00',
          endTime: '10:00',
          notes: ''
        });
      }
    };

  const closeModal =
    () => {

      setDay(null);
      setEditing(null);
    };

  const saveClass =
    () => {

      if (
        !form.title.trim()
      ) {

        alert(
          'Escribe el nombre de la clase.'
        );

        return;
      }

      if (day === null) {
        return;
      }

      const course =
        courses.find(
          item =>
            item.id ===
            form.courseId
        );

      const item = {

        type:
          'clase',

        title:
          form.title.trim(),

        date:
          new Date(
            year,
            month,
            day
          ).toISOString()
           .slice(
             0,
             10
           ),

        time:
          form.time,

        endTime:
          form.endTime,

        courseId:
          form.courseId,

        courseName:
          course?.name || '',

        color:
          course?.color ||
          '#3b82f6',

        notes:
          form.notes,

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

      closeModal();
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
        lg:flex-row
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
            Clases de
            {' '}
            {monthName}
            {' '}
            {year}
          </h2>

          <p className="
            text-xs
            text-zinc-500
          ">
            Pulsa un día para
            añadir una clase,
            seleccionar curso
            y establecer horario.
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
            onClick={() => {

              setYear(
                now.getFullYear()
              );

              setMonth(
                now.getMonth()
              );

            }}
          >
            Hoy
          </button>

          <button
            className="nox-btn"
            onClick={() =>
              changeMonth(1)
            }
          >
            →
          </button>

        </div>

      </div>

      <div className="
        grid
        grid-cols-2
        sm:grid-cols-4
        gap-3
      ">

        {
          classes
            .slice()
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
            .map(item => (

              <div
                key={item.id}
                className="
                  card-nox
                  p-4
                  rounded-2xl
                "
              >

                <div className="
                  text-xs
                  text-blue-400
                  font-bold
                ">
                  {item.date}
                  {' · '}
                  {item.time || '--:--'}
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
                </p>

                <div className="
                  flex
                  gap-2
                  mt-3
                ">

                  <button
                    className="
                      nox-btn
                      text-xs
                    "

                    onClick={() =>
                      openModal(
                        new Date(
                          item.date
                        ).getDate(),
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
                      text-xs
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
            ))
        }

      </div>

      <div className="
        grid
        grid-cols-7
        gap-1.5
        sm:gap-2
      ">

        {
          [
            'Lun',
            'Mar',
            'Mié',
            'Jue',
            'Vie',
            'Sáb',
            'Dom'
          ].map(dayName => (

            <div
              key={dayName}
              className="
                text-center
                text-xs
                font-bold
                text-zinc-500
                py-2
              "
            >
              {dayName}
            </div>

          ))
        }

        {
          Array.from({
            length:
              (
                new Date(
                  year,
                  month,
                  1
                ).getDay() +
                6
              ) % 7
          }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
              />
            )
          )
        }

        {
          Array.from({
            length:
              new Date(
                year,
                month + 1,
                0
              ).getDate()
          }).map(
            (_, index) => {

              const dayNumber =
                index + 1;

              const dayItems =
                classes.filter(
                  item =>
                    new Date(
                      item.date
                    ).getDate() ===
                    dayNumber
                );

              const isToday =
                now.getFullYear() ===
                  year &&
                now.getMonth() ===
                  month &&
                now.getDate() ===
                  dayNumber;

              return (

                <button
                  key={dayNumber}

                  onClick={() =>
                    openModal(
                      dayNumber
                    )
                  }

                  className={`
                    calendar-day
                    ${isToday ? 'today' : ''}
                  `}
                >

                  <span className="
                    font-bold
                  ">
                    {dayNumber}
                  </span>

                  <div className="
                    space-y-1
                    mt-2
                  ">

                    {
                      dayItems
                        .slice(0, 3)
                        .map(item => (

                          <div
                            key={item.id}
                            className="
                              event-chip
                              blue
                            "
                          >
                            {
                              item.time
                                ? item.time + ' '
                                : ''
                            }

                            {item.title}
                          </div>

                        ))
                    }

                  </div>

                  <span className="
                    add-day
                  ">
                    + Añadir clase
                  </span>

                </button>
              );
            }
          )
        }

      </div>

      {
        day !== null &&
        <div
          className="modal-backdrop"

          onMouseDown={
            event => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
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

              <div>

                <h3 className="
                  text-xl
                  font-black
                ">
                  {
                    editing
                      ? 'Editar clase'
                      : 'Nueva clase'
                  }
                </h3>

                <p className="
                  text-xs
                  text-zinc-500
                ">
                  {day}
                  {' de '}
                  {monthName}
                </p>

              </div>

              <button
                className="nox-icon"
                onClick={
                  closeModal
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

                  onChange={event =>
                    setForm({
                      ...form,
                      courseId:
                        event.target.value
                    })
                  }
                >

                  <option value="">
                    Sin curso /
                    crear después
                  </option>

                  {
                    courses.map(
                      course => (
                        <option
                          key={course.id}
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
                Nombre

                <input
                  className="nox-input"
                  value={
                    form.title
                  }

                  onChange={event =>
                    setForm({
                      ...form,
                      title:
                        event.target.value
                    })
                  }

                  placeholder="Clase 1"
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
                  Inicio

                  <input
                    type="time"
                    className="nox-input"
                    value={
                      form.time
                    }

                    onChange={event =>
                      setForm({
                        ...form,
                        time:
                          event.target.value
                      })
                    }
                  />
                </label>

                <label className="
                  field-label
                ">
                  Fin

                  <input
                    type="time"
                    className="nox-input"
                    value={
                      form.endTime
                    }

                    onChange={event =>
                      setForm({
                        ...form,
                        endTime:
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

                  onChange={event =>
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
                  saveClass
                }
              >
                {
                  editing
                    ? 'Guardar cambios'
                    : 'Crear clase'
                }
              </button>

            </div>

          </div>

        </div>
      }

    </div>
  );
};

/* ================================================================
   CÓDIGO ORIGINAL PRESERVADO
   ================================================================ */

/*
const { useState } = React;

window.ClasesSection = function ClasesSection({ items = [], onAddItem }) {

  const [year, setYear] =
    useState(new Date().getFullYear());

  const [month, setMonth] =
    useState(new Date().getMonth());

  const now = new Date();

  const isCurrentMonth =
    now.getFullYear() === year &&
    now.getMonth() === month;

  const changeMonth = (dir) => {

    let newMonth = month + dir;
    let newYear = year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const monthName =
    new Date(year, month)
      .toLocaleString(
        'es-ES',
        {
          month: 'long'
        }
      );

  const semanas =
    [1, 2, 3, 4].map(
      num =>
        `Semana ${num} - ${monthName} ${year}`
    );

  const dias = [
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
    'Dom'
  ];

  return (
    <div className="space-y-6">

      <div className="
        flex
        flex-col
        sm:flex-row
        justify-between
        items-start
        sm:items-center
        gap-4
        card-nox
        p-4 sm:p-6
        rounded-3xl
      ">

        <div className="
          flex
          items-center
          gap-3
        ">

          <h2 className="
            text-xl
            sm:text-2xl
            font-bold
            capitalize
          ">
            Clases de
            {' '}
            {monthName}
            {' '}
            {year}
          </h2>

          {
            isCurrentMonth &&
            <span className="
              px-2.5
              py-1
              bg-emerald-500/20
              text-emerald-400
              border
              border-emerald-500/30
              rounded-full
              text-xs
              font-bold
              flex
              items-center
              gap-1
            ">
              <span className="
                w-2
                h-2
                rounded-full
                bg-emerald-400
                animate-pulse
              />
              Mes Actual
            </span>
          }

        </div>

        <div className="
          flex
          gap-2
          items-center
        ">

          <button
            onClick={() =>
              changeMonth(-1)
            }

            className="
              p-2
              bg-zinc-900
              hover:bg-zinc-800
              rounded-xl
            "
          >
            ← Anterior
          </button>

          <button
            onClick={() => {
              setYear(
                now.getFullYear()
              );

              setMonth(
                now.getMonth()
              );
            }}

            className="
              p-2
              bg-zinc-800
              hover:bg-zinc-700
              rounded-xl
              text-xs
              text-purple-300
            "
          >
            Hoy
          </button>

          <button
            onClick={() =>
              changeMonth(1)
            }

            className="
              p-2
              bg-zinc-900
              hover:bg-zinc-800
              rounded-xl
            "
          >
            Siguiente →
          </button>

        </div>

      </div>

      {
        semanas.map(
          (
            semanaNom,
            semIdx
          ) => (

            <div
              key={semIdx}
              className="
                card-nox
                p-4 sm:p-5
                rounded-3xl
              "
            >

              <h3 className="
                font-bold
                text-base sm:text-lg
                mb-4
                text-purple-400
                capitalize
              ">
                {semanaNom}
              </h3>

              <div className="
                grid
                grid-cols-2
                sm:grid-cols-4
                md:grid-cols-7
                gap-2.5
              ">

                {
                  dias.map(
                    dia => (

                      <div
                        key={dia}
                        className="
                          p-2.5
                          rounded-2xl
                          bg-zinc-950
                          border
                          border-zinc-900
                          min-h-[110px]
                          flex
                          flex-col
                          justify-between
                        "
                      >

                        <span className="
                          text-xs
                          font-bold
                          text-zinc-400
                        ">
                          {dia}
                        </span>

                        <button

                          onClick={() =>
                            onAddItem({
                              type:
                                'clase',

                              title:
                                `Clase ${dia}`,

                              date:
                                new Date(
                                  year,
                                  month,
                                  semIdx * 7 + 1
                                )
                                  .toISOString()
                                  .split('T')[0]
                            })
                          }

                          className="
                            w-full
                            mt-2
                            py-1.5
                            text-[10px]
                            bg-zinc-900
                            hover:bg-purple-900/40
                            hover:text-purple-300
                            rounded-lg
                            text-zinc-400
                            active:scale-95
                            transition
                          "
                        >
                          + Añadir Clase
                        </button>

                      </div>
                    )
                  )
                }

              </div>

            </div>
          )
        )
      }

    </div>
  );
};
*/
