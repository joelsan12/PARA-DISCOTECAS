// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS Y GERENTES
// Módulo de Cartelera de Eventos (100% Fácil y Sin Tecnicismos)

#set document(
  title: "Guía Visual Práctica — Cartelera de Eventos",
  author: "NIGHTFLOW VIP",
  date: auto
)

#set page(
  paper: "a4",
  margin: (top: 1.8cm, bottom: 1.8cm, left: 1.8cm, right: 1.8cm),
  header: context {
    if here().page() > 1 [
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[NIGHTFLOW VIP · GUÍA PRÁCTICA PARA DUEÑOS Y GERENTES],
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[CARTELERA DE EVENTOS & FIESTAS]
      )
      #line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
    ]
  },
  footer: context {
    if here().page() > 1 [
      #line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
      #v(2pt)
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Diseñado para operar discotecas, bares y lounges sin enredos],
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[Página #counter(page).display()]
      )
    ]
  }
)

#set text(
  font: ("Segoe UI", "Arial", "Helvetica"),
  size: 9.3pt,
  fill: rgb("#1e293b"),
  lang: "es"
)

#set par(
  justify: true,
  leading: 0.58em
)

#let gold = rgb("#d97706")
#let emerald = rgb("#059669")
#let dark-slate = rgb("#0f172a")
#let cyan = rgb("#0284c7")
#let purple = rgb("#9333ea")

#let step-title(num, title, subtitle) = [
  #rect(
    width: 100%,
    fill: rgb("#0b0f19"),
    radius: 6pt,
    inset: (x: 10pt, y: 7pt),
    stroke: 1pt + rgb("#d97706")
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 10pt,
      align: horizon,
      [
        #box(
          fill: rgb("#d97706"),
          radius: 4pt,
          inset: (x: 8pt, y: 4pt),
          text(fill: white, size: 9pt, weight: "black")[PASO #num]
        )
      ],
      [
        #text(fill: white, size: 11pt, weight: "bold")[#title] \
        #text(fill: rgb("#cbd5e1"), size: 8.2pt)[#subtitle]
      ]
    )
  ]
  #v(3pt)
]

#let signal-item(num, label, desc, color: gold) = [
  #rect(
    width: 100%,
    fill: rgb("#f8fafc"),
    stroke: 0.5pt + rgb("#e2e8f0"),
    radius: 4pt,
    inset: (x: 7pt, y: 4pt)
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 7pt,
      align: horizon,
      [
        #circle(
          radius: 8.5pt,
          fill: color,
          align(center + horizon, text(fill: white, size: 7.5pt, weight: "bold")[#num])
        )
      ],
      [
        #text(weight: "bold", size: 8.8pt, fill: rgb("#0f172a"))[#label: ]
        #text(size: 8.5pt, fill: rgb("#475569"))[#desc]
      ]
    )
  ]
  #v(1.5pt)
]

#let tip-box(title, text-content) = [
  #rect(
    width: 100%,
    fill: rgb("#ecfdf5"),
    stroke: (left: 3pt + rgb("#059669"), rest: 0.5pt + rgb("#a7f3d0")),
    radius: (right: 4pt),
    inset: (x: 8pt, y: 5pt)
  )[
    #text(size: 8.2pt, weight: "bold", fill: rgb("#065f46"))[CONSEJO PRÁCTICO: #title] \
    #text(size: 8.3pt, fill: rgb("#047857"))[#text-content]
  ]
]

// ==========================================
// PÁGINA 1: PORTADA
// ==========================================

#align(center + horizon)[
  #rect(
    width: 100%,
    fill: rgb("#080b12"),
    radius: 10pt,
    inset: (x: 24pt, y: 32pt),
    stroke: 2pt + rgb("#d97706")
  )[
    #v(10pt)
    #text(size: 14pt, weight: "black", fill: rgb("#e5b54f"), tracking: 4pt)[NIGHTFLOW VIP] \
    #v(3pt)
    #text(size: 8.5pt, weight: "bold", fill: rgb("#94a3b8"), tracking: 2pt)[SISTEMA DE CONTROL Y RESERVAS PARA DISCOTECAS]

    #v(22pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(16pt)

    #text(size: 22pt, weight: "black", fill: white)[GUÍA VISUAL FÁCIL] \
    #v(6pt)
    #text(size: 14pt, weight: "bold", fill: rgb("#e5b54f"))[Cartelera de Eventos & Fiestas Especiales] \
    #v(8pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Aprende a publicar tus noches de fiesta en internet en menos de 3 minutos: \
      agrega flyers, define el precio de entrada y hora de apertura, \
      y permite que tus clientes reserven sus mesas con anticipación.
    ]

    #v(20pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(22pt)

    #grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 10pt,
      align: center,
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[DIRIGIDO A] \
        #text(size: 9pt, weight: "bold", fill: white)[Dueños y Gerentes]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[TIPO DE GUÍA] \
        #text(size: 9pt, weight: "bold", fill: rgb("#34d399"))[Visual y sin tecnicismos]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[RESULTADO] \
        #text(size: 9pt, weight: "bold", fill: rgb("#e5b54f"))[Fiestas publicadas al instante]
      ]
    )
    #v(10pt)
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 2: ¿PARA QUÉ SIRVE?
// ==========================================

#text(size: 14pt, weight: "black", fill: dark-slate)[¿Para qué sirve la Cartelera de Eventos y cómo te hace vender más?]
#v(2pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  Publicar tus fiestas solo en Instagram o en estados de WhatsApp hace que la gente pregunte precios por mensaje y se pierdan muchas ventas. La Cartelera de Eventos de Nightflow conecta tus fiestas con tu mapa de mesas para que los clientes compren solos:
]

#v(6pt)
#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 9pt
    )[
      #text(weight: "bold", size: 9.5pt, fill: gold)[1. Tu Local Siempre Activo en Internet] \
      #v(2pt)
      Tus clientes entran a tu enlace y ven el cartel de este viernes, sábado o feriado con su foto, el DJ invitado y el precio de la entrada.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 9pt
    )[
      #text(weight: "bold", size: 9.5pt, fill: emerald)[2. Reservas Cobradas por Adelantado] \
      #v(2pt)
      Cada evento tiene su propio mapa de mesas. El cliente elige su mesa favorita y paga su anticipo con tarjeta antes de salir de casa.
    ]
  ]
)

#v(8pt)
#text(size: 11pt, weight: "bold", fill: dark-slate)[Lo que Ganas al Usar la Cartelera de Eventos]
#v(3pt)

#table(
  columns: (1.5fr, 2.5fr, 2.5fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 5.5pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[ASPECTO],
    text(fill: white, weight: "bold", size: 8pt)[MÉTODO TRADICIONAL],
    text(fill: white, weight: "bold", size: 8pt)[CON NIGHTFLOW VIP]
  ),

  [Venta de entradas],
  [Filas largas en la puerta a las 11:00 PM cobrando en efectivo.],
  [Entradas y mesas vendidas desde el miércoles por internet.],

  [Cambio de precios],
  [Discutir con clientes si el cover subió después de medianoche.],
  [El precio se actualiza en el sistema y se cobra con exactitud.],

  [Control de DJ y temática],
  [Hojas impresas que nadie lee o clientes confundidos en barra.],
  [La cartelera muestra el género musical, el DJ y la hora de inicio.]
)

#v(8pt)
#tip-box("Crea tus Fiestas con Tiempo", "Crea los eventos de todo el mes a principios de semana. Así tus clientes más fieles podrán apartar las mejores mesas VIP con días de anticipación.")

#pagebreak()

// ==========================================
// PÁGINA 3: PASO 1 — LA PANTALLA PRINCIPAL
// ==========================================

#step-title("1", "La Pantalla de tus Eventos Activos", "Conoce tus fiestas programadas y cómo están mostradas.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_cartelera_eventos.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Las 4 cosas que ves en la pantalla de eventos:]

#signal-item("1", "Botón '+ Nuevo Evento'", "Al presionarlo se abre la ventana rápida para crear una nueva fiesta temática o noche de club.", color: gold)

#signal-item("2", "Tarjeta de Evento Activo", "Muestra la foto de portada del evento, el nombre de la fiesta (ej. 'NEON NIGHTS') y el artista invitado.", color: emerald)

#signal-item("3", "Fecha, Horario y Precio de Entrada", "Indica qué día es la fiesta, a qué hora abren las puertas y cuánto cuesta el cover general.", color: cyan)

#signal-item("4", "Botones de Editar y Ocultar", "El lápiz te permite cambiar precios u horarios. El botón del ojo te permite ocultar el evento si se agotaron las mesas.", color: purple)

#v(3pt)
#tip-box("Ocultar sin Borrar", "Si una fiesta ya pasó o quieres pausar las ventas por unas horas, solo toca el icono del ojo para ocultarla sin perder la información.")

#pagebreak()

// ==========================================
// PÁGINA 4: PASO 2 — CREAR UN NUEVO EVENTO
// ==========================================

#step-title("2", "Cómo Crear un Nuevo Evento Paso a Paso", "Llena solo 4 datos básicos y tu evento estará listo para vender mesas.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_02_modal_crear_evento.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Los campos que debes completar en la ventana:]

#signal-item("1", "Nombre de la Fiesta y Subtítulo", "Escribe el nombre de la noche (ej. 'Black Carpet VIP') y una frase atractiva para animar a tus clientes.", color: gold)

#signal-item("2", "Fecha y Hora de Apertura de Puertas", "Elige el día en el calendario (ej. Sábado 24) y la hora en que los clientes pueden ingresar (ej. 22:00 hs).", color: emerald)

#signal-item("3", "Precio del Cover en Puerta", "Coloca el costo de la entrada general en dólares para quienes ingresan sin mesa reservada.", color: cyan)

#signal-item("4", "Flyer y Guardar", "Pega el enlace de la imagen publicitaria de tu fiesta y presiona 'Guardar Evento' para que aparezca en tu web.", color: purple)

#v(3pt)
#tip-box("Usa Fotos de Buena Calidad", "Una foto atractiva y bien iluminada hace que la gente se anime a reservar palcos VIP con mayor facilidad.")

#pagebreak()

// ==========================================
// PÁGINA 5: PASO 3 — PUBLICAR O EDITAR EN VIVO
// ==========================================

#step-title("3", "Modifica Precios u Horarios Durante la Noche", "Todo lo que cambias se actualiza al segundo en los celulares de tus clientes.")

#v(3pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  A veces necesitas ajustar el precio del cover a mitad de la noche o cambiar el DJ invitado de última hora:
]

#v(4pt)
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 8pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 7pt
    )[
      #text(weight: "bold", size: 8.8pt, fill: gold)[1. Toca el Lápiz] \
      #v(2pt)
      En la tarjeta del evento, pulsa el botón del lápiz para abrir la edición rápida.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 7pt
    )[
      #text(weight: "bold", size: 8.8pt, fill: emerald)[2. Cambia lo que Quieras] \
      #v(2pt)
      Puedes ajustar el precio de la entrada, cambiar la hora de cierre o cambiar el texto promocional.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 7pt
    )[
      #text(weight: "bold", size: 8.8pt, fill: purple)[3. Presiona Guardar] \
      #v(2pt)
      El cambio se refleja al instante tanto en la página web pública como en la terminal del portero.
    ]
  ]
)

#v(8pt)
#rect(
  width: 100%,
  fill: rgb("#fffbeb"),
  stroke: (left: 3pt + rgb("#d97706"), rest: 0.5pt + rgb("#fef3c7")),
  radius: (right: 5pt),
  inset: (x: 10pt, y: 6pt)
)[
  #text(weight: "bold", size: 8.8pt, fill: rgb("#92400e"))[IMPORTANTE: LAS RESERVAS YA PAGADAS NO CAMBIAN] \
  #v(1pt)
  #text(size: 8.4pt, fill: rgb("#78350f"))[
    Si cambias el precio del cover general o el consumo mínimo de una mesa a las 11:00 PM, los clientes que ya habían reservado y pagado su anticipo por internet mantendrán su precio acordado. Esto evita reclamos y da seriedad a tu local.
  ]
]

#v(8pt)
#text(size: 11pt, weight: "black", fill: dark-slate)[Los 4 Consejos de Oro para Llenar tus Noches]
#v(3pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *1. Publica con 5 días de anticipación:* \
      La mayoría de grupos de amigos organizan su salida los martes o miércoles.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *2. Pon el precio del cover claro:* \
      La gente prefiere saber exactamente cuánto cuesta la entrada antes de llegar a la puerta.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *3. Comparte el enlace directo:* \
      Pon el link de tu club en el perfil de Instagram para que compren sin hacer preguntas.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *4. Revisa los eventos viejos:* \
      Oculta las fiestas de semanas pasadas para que la cartelera se mantenga fresca y moderna.
    ]
  ]
)

#v(10pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Guía de Operaciones Prácticas para Dueños y Gerentes de Negocios Nocturnos]
]
