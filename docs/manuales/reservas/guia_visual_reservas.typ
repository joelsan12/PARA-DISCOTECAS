// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS Y GERENTES
// Módulo de Reservas Activas y Control de Entrada (100% Fácil)

#set document(
  title: "Guía Visual Práctica — Reservas Activas y Entrada",
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
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[CONTROL DE RESERVAS & ENTRADA]
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
    #text(size: 14pt, weight: "bold", fill: rgb("#e5b54f"))[Control de Reservas & Entrada en Puerta] \
    #v(8pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Encuentra a cualquier cliente en 2 segundos cuando llega al local: \
      revisa su mesa asignada, cuántos amigos lo acompañan, \
      y si ya pagó su anticipo o debe pagar en la entrada.
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
        #text(size: 9pt, weight: "bold", fill: white)[Dueños, Gerentes y Porteros]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[TIPO DE GUÍA] \
        #text(size: 9pt, weight: "bold", fill: rgb("#34d399"))[Visual y sin tecnicismos]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[RESULTADO] \
        #text(size: 9pt, weight: "bold", fill: rgb("#e5b54f"))[Entrada fluida y sin filas]
      ]
    )
    #v(10pt)
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 2: ¿PARA QUÉ SIRVE?
// ==========================================

#text(size: 14pt, weight: "black", fill: dark-slate)[¿Para qué sirve la Lista de Reservas y cómo evita problemas en la puerta?]
#v(2pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  A las 11:30 PM, cuando llegan 20 grupos a la vez, revisar listas en hojas de papel engrapadas genera discusiones y demoras. La pantalla de Reservas Activas te permite encontrar a cualquier cliente al escribir las primeras letras de su nombre:
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
      #text(weight: "bold", size: 9.5pt, fill: gold)[1. Búsqueda en Menos de 3 Segundos] \
      #v(2pt)
      Escribes 'Carlos' o el número de mesa y ves su ficha completa: su teléfono, la zona VIP donde se sienta y cuántos invitados tiene autorizados.
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
      #text(weight: "bold", size: 9.5pt, fill: emerald)[2. Cero Peleas por el Pago] \
      #v(2pt)
      El sistema te muestra claramente si el cliente ya pagó su anticipo con tarjeta en la web (badge verde) o si debe abonar en la entrada (badge amarillo).
    ]
  ]
)

#v(8pt)
#text(size: 11pt, weight: "bold", fill: dark-slate)[Por Qué es Mucho Mejor que las Listas de Papel]
#v(3pt)

#table(
  columns: (1.5fr, 2.5fr, 2.5fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 5.5pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[SITUACIÓN EN LA ENTRADA],
    text(fill: white, weight: "bold", size: 8pt)[CON LISTAS EN PAPEL (CAOS)],
    text(fill: white, weight: "bold", size: 8pt)[CON NIGHTFLOW VIP]
  ),

  [Cliente dice que tiene mesa],
  [Buscar hoja por hoja con una linterna en la oscuridad.],
  [*Escribes el apellido:* aparece la mesa en 1 segundo.],

  [Llegan más amigos de los permitidos],
  [Discutir si la mesa era para 6 o para 10 personas.],
  [*El aforo es exacto:* la pantalla indica el límite de personas.],

  [Confirmar anticipo cobrado],
  [Pedirle capturas de pantalla de la transferencia bancaria.],
  [*Comprobado:* la insignia verde indica pago verificado.]
)

#v(8pt)
#tip-box("Fácil para el Personal de Puerta", "El portero o la anfitriona puede usar un celular o tablet en la entrada. Con solo pulsar sobre la reserva, se marca como ingresada.")

#pagebreak()

// ==========================================
// PÁGINA 3: PASO 1 — LA PANTALLA PRINCIPAL
// ==========================================

#step-title("1", "La Pantalla de Reservas de la Noche", "Todo lo que necesitas saber de los clientes que reservaron hoy.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_reservas_activas.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Las 4 herramientas clave de la pantalla:]

#signal-item("1", "Buscador Rápido", "Escribe el nombre del cliente, su número de celular o el número de mesa para encontrar la reserva al instante.", color: gold)

#signal-item("2", "Filtros de Asistencia", "Alterna entre 'Todas', 'Confirmadas' (clientes que aún no llegan) y 'Adentro' (clientes que ya ingresaron).", color: emerald)

#signal-item("3", "Fila con Datos del Cliente", "Indica el código de reserva, la mesa asignada (ej. VIP-03), el titular y la cantidad de amigos que lo acompañan.", color: cyan)

#signal-item("4", "Estado del Pago y Anticipo", "Insignia que confirma si el anticipo ya fue cobrado por internet o si el cliente debe cancelar en puerta.", color: purple)

#v(3pt)
#tip-box("Buscar por Teléfono", "Si el cliente tiene un nombre común como 'Juan', búscalo por los últimos 4 dígitos de su celular para encontrarlo de inmediato.")

#pagebreak()

// ==========================================
// PÁGINA 4: PASO 2 — LOS COLORES DE PAGO
// ==========================================

#step-title("2", "Cómo Saber si la Reserva ya está Pagada", "Aprende a leer las insignias de pago para no cobrar dos veces ni dejar entrar gratis.")

#v(3pt)

#table(
  columns: (1.3fr, 2.2fr, 2.8fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 6pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[INSIGNIA DE PAGO],
    text(fill: white, weight: "bold", size: 8pt)[QUÉ SIGNIFICA],
    text(fill: white, weight: "bold", size: 8pt)[QUÉ DEBE HACER EL PORTERO]
  ),

  [
    #box(fill: rgb("#064e3b"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#34d399"), weight: "bold", size: 7.8pt)[● PAGADO])
  ],
  [
    *Anticipo Cobrado con Éxito* \
    El cliente pagó el anticipo o la totalidad de la mesa por la página web.
  ],
  [
    Darle la bienvenida de inmediato, colocarle la manilla VIP a él y a su grupo y guiarlo a su mesa. *No pedir dinero adicional en puerta.*
  ],

  [
    #box(fill: rgb("#854d0e"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#fde68a"), weight: "bold", size: 7.8pt)[● PENDIENTE / PUERTA])
  ],
  [
    *Pago en la Entrada* \
    El cliente apartó la mesa pero acordó abonar el valor del cover o anticipo al llegar al club.
  ],
  [
    Solicitar el pago en la caja de puerta (efectivo o tarjeta) antes de permitir el ingreso del grupo a la sala.
  ],

  [
    #box(fill: rgb("#581c87"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#e9d5ff"), weight: "bold", size: 7.8pt)[● REEMBOLSADO])
  ],
  [
    *Reserva Anulada / Devuelta* \
    La reserva fue cancelada y el dinero fue devuelto al cliente previamente.
  ],
  [
    *El pase no es válido.* Informar amablemente al cliente que la reserva fue cancelada y no tiene mesa asignada.
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
  #text(weight: "bold", size: 8.8pt, fill: rgb("#92400e"))[CONTROL DE AFORO POR MESA: CERO SOBREPOBLACIÓN] \
  #v(1pt)
  #text(size: 8.4pt, fill: rgb("#78350f"))[
    Cada reserva indica la cantidad exacta de personas autorizadas (ej. 6 personas). Si un grupo llega con 10 amigos, el portero debe cobrar cover individual a los 4 adicionales o coordinar con gerencia para no saturar el espacio de la mesa.
  ]
]

#v(8pt)
#text(size: 11pt, weight: "black", fill: dark-slate)[Los 4 Consejos de Oro para una Puerta Fluida]
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
      *1. Wi-Fi estable en la puerta:* \
      Asegúrate de que la tablet del portero tenga buena señal de Wi-Fi para que las reservas se actualicen al instante.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *2. Marca el ingreso de inmediato:* \
      Apenas entre el grupo, presiona sobre la reserva para que en la barra sepan que la mesa ya está ocupada.
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
      *3. Si no traen el código, busca el nombre:* \
      Si el cliente no encuentra su correo en el celular, búscalo por su apellido en el buscador.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *4. Revisa las notas de la reserva:* \
      Algunos clientes dejan notas como 'Cumpleaños de María' para que el mesero prepare bengalas.
    ]
  ]
)

#v(10pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Guía de Operaciones Prácticas para Dueños y Gerentes de Negocios Nocturnos]
]
