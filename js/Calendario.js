const { useState } = React;

window.CalendarioSection =
function CalendarioSection({
  items = []
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

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const firstDayIndex =
    (
      new Date(
        year,
        month,
        1
      ).getDay() + 6
    ) % 7;

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

  return (

    <div className="
      card-nox
      p-4 sm:p-6
      rounded-3xl
    ">

      <div className="
        flex
        flex-col
        sm:flex-row
        justify-between
        gap-4
        mb-5
      ">

        <div>

          <h2 className="
            text-xl
            sm:text-2xl
            font-bold
            capitalize
          ">
            {monthName}
            {' '}
            {year}
          </h2>

          <p className="
            text-xs
            text-zinc-500
          ">
            Vista general de clases,
            exámenes, parciales y
            entregables.
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
        flex
        flex-wrap
        gap-2
        mb-5
        text-xs
      ">

        <span className="
          legend
          blue
        ">
          🔵 Clases
        </span>

        <span className="
          legend
          red
        ">
          🔴 Exámenes
        </span>

        <span className="
          legend
          purple
        ">
          🟣 Parciales
        </span>

        <span className="
          legend
          yellow
        ">
          🟡 Entregables
        </span>

      </div>

      <div className="
        grid
        grid-cols-7
        gap-1.5
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
          ].map(day => (

            <div
              key={day}
              className="
                text-center
                font-bold
                text-xs
                text-zinc-500
                py-2
              "
            >
              {day}
            </div>

          ))
        }

        {
          Array.from({
            length:
              firstDayIndex
          }).map(
            (_, index) => (

              <div
                key={
                  `empty-${index}`
                }
              />

            )
          )
        }

        {
          Array.from({
            length:
              daysInMonth
          }).map(
            (_, index) => {

              const day =
                index + 1;

              const dayItems =
                items.filter(
                  item => {

                    const date =
                      new Date(
                        item.date
                      );

                    return (
                      date.getFullYear() ===
                        year &&
                      date.getMonth() ===
                        month &&
                      date.getDate() ===
                        day
                    );

                  }
                );

              const isToday =
                now.getFullYear() ===
                  year &&
                now.getMonth() ===
                  month &&
                now.getDate() ===
                  day;

              return (

                <div
                  key={day}
                  className={
                    `calendar-day ${
                      isToday
                        ? 'today'
                        : ''
                    }`
                  }
                >

                  <span className="
                    font-bold
                  ">
                    {day}
                  </span>

                  <div className="
                    space-y-1
                    mt-2
                    overflow-y-auto
                    max-h-28
                  ">

                    {
                      dayItems.map(
                        item => {

                          let type =
                            'blue';

                          if (
                            item.type ===
                            'examen'
                          ) {
                            type =
                              'red';
                          }

                          if (
                            item.type ===
                            'parcial'
                          ) {
                            type =
                              'purple';
                          }

                          if (
                            item.type ===
                            'entregable'
                          ) {
                            type =
                              'yellow';
                          }

                          return (

                            <div
                              key={
                                item.id
                              }
                              className={
                                `event-chip ${type}`
                              }
                              title={
                                `${item.courseName || ''} ${item.title}`
                              }
                            >
                              {
                                item.time
                                  ? `${item.time} `
                                  : ''
                              }

                              {item.title}

                            </div>

                          );
                        }
                      )
                    }

                  </div>

                </div>
              );
            }
          )
        }

      </div>

    </div>
  );
};
