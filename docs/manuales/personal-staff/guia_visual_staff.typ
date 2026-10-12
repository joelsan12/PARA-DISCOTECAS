// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS Y GERENTES
// Módulo de Personal, Meseros y Roles de Sala (100% Fácil)

#set document(
  title: "Guía Visual Práctica — Personal, Meseros y Roles",
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
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[PERSONAL, MESEROS & ROLES]
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
    #text(size: 14pt, weight: "bold", fill: rgb("#e5b54f"))[Personal, Meseros & Roles de Sala] \
    #v(8pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Organiza a tu equipo de trabajo sin enredos: \
      asigna qué mesas atiende cada mesero, dale acceso al portero para escanear pases, \
      y protege tu dinero asegurando que solo el cajero pueda cerrar cuentas.
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
        #text(size: 9pt, weight: "bold", fill: rgb("#e5b54f"))[Equipo coordinado y seguro]
      ]
    )
    #v(10pt)
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 2: ¿PARA QUÉ SIRVE?
// ==========================================

#text(size: 14pt, weight: "black", fill: dark-slate)[¿Para qué sirve el Módulo de Personal y cómo te protege?]
#v(2pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  Darle la misma contraseña de administrador a todos los meseros y guardias es muy peligroso para un club: cualquiera podría anular cobros o ver datos privados. Este módulo te permite crear un acceso individual para cada trabajador con permisos exactos:
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
      #text(weight: "bold", size: 9.5pt, fill: gold)[1. Cada Quien Hace su Trabajo] \
      #v(2pt)
      El portero solo ve el escáner de pases. El mesero solo ve los pedidos de sus mesas asignadas. El cajero solo ve las cuentas por cobrar. Nadie toca lo que no le corresponde.
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
      #text(weight: "bold", size: 9.5pt, fill: emerald)[2. Zonas de Mesas Claras] \
      #v(2pt)
      Le asignas al Mesero Juan las mesas VIP del 1 al 6, y a la Mesera Sofía las mesas del 7 al 12. Así cada quien atiende su sector sin descuidar a ningún cliente.
    ]
  ]
)

#v(8pt)
#text(size: 11pt, weight: "bold", fill: dark-slate)[Los 5 Cargos del Club y sus Colores]
#v(3pt)

#table(
  columns: (1.5fr, 1.8fr, 3.2fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 5.5pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[CARGO EN EL CLUB],
    text(fill: white, weight: "bold", size: 8pt)[COLOR DEL BADGE],
    text(fill: white, weight: "bold", size: 8pt)[QUÉ PUEDE HACER EN EL SISTEMA]
  ),

  [*Dueño / Socio*],
  [#box(fill: rgb("#78350f"), radius: 3pt, inset: (x: 4pt, y: 2pt), text(fill: rgb("#fde68a"), weight: "bold", size: 7.5pt)[DORADO VIP])],
  [Acceso total a todo el sistema, informes de ganancias y configuración de cuentas bancarias.],

  [*Gerente General*],
  [#box(fill: rgb("#581c87"), radius: 3pt, inset: (x: 4pt, y: 2pt), text(fill: rgb("#e9d5ff"), weight: "bold", size: 7.5pt)[MORADO REAL])],
  [Supervisa la sala en vivo, aprueba cambios de mesa y maneja al personal de turno.],

  [*Cajero / Finanzas*],
  [#box(fill: rgb("#854d0e"), radius: 3pt, inset: (x: 4pt, y: 2pt), text(fill: rgb("#fed7aa"), weight: "bold", size: 7.5pt)[ÁMBAR])],
  [Cobra las comandas de las mesas y registra pagos en efectivo o tarjeta.],

  [*Control de Puerta*],
  [#box(fill: rgb("#064e3b"), radius: 3pt, inset: (x: 4pt, y: 2pt), text(fill: rgb("#34d399"), weight: "bold", size: 7.5pt)[VERDE ESMERALDA])],
  [Escanea códigos QR en la entrada, valida boletos y registra el ingreso de clientes.],

  [*Mesero de Sala*],
  [#box(fill: rgb("#075985"), radius: 3pt, inset: (x: 4pt, y: 2pt), text(fill: rgb("#7dd3fc"), weight: "bold", size: 7.5pt)[AZUL CELESTE])],
  [Ve los pedidos de botellas de sus mesas y marca las entregas completadas.]
)

#v(8pt)
#tip-box("Protege tu Acceso Principal", "Nunca uses la cuenta de Dueño en el celular de un empleado. Crea a cada trabajador como Mesero o Puerta para que tu información financiera esté segura.")

#pagebreak()

// ==========================================
// PÁGINA 3: PASO 1 — LA LISTA DE PERSONAL
// ==========================================

#step-title("1", "La Pantalla de tu Equipo de Trabajo", "Mira a todos tus colaboradores y sus cargos en un solo vistazo.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_lista_staff.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Las 4 secciones clave de la lista:]

#signal-item("1", "Botón '+ Agregar Colaborador'", "Abre la ventana para dar de alta a un nuevo mesero, portero o cajero en tu discoteca.", color: gold)

#signal-item("2", "Filtros por Cargo", "Filtra rápidamente para ver solo a tus meseros, solo al equipo de seguridad de puerta o a los cajeros.", color: emerald)

#signal-item("3", "Insignia de Cargo con Color", "Cada trabajador tiene su insignia de color para que identifiques su puesto de inmediato.", color: cyan)

#signal-item("4", "Zonas Asignadas y Acciones", "Muestra qué mesas le tocan a cada mesero y te permite suspender su cuenta si ya no trabaja contigo.", color: purple)

#v(3pt)
#tip-box("Suspender en 1 Segundo", "Si un trabajador deja de laborar en el club, puedes pulsar 'Suspender' para quitarle el acceso de inmediato sin borrar su historial.")

#pagebreak()

// ==========================================
// PÁGINA 4: PASO 2 — AGREGAR UN EMPLEADO
// ==========================================

#step-title("2", "Cómo Agregar a un Nuevo Colaborador", "Asígnale su puesto y sus mesas en menos de 1 minuto.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_02_modal_agregar_staff.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Los datos que debes llenar en la ventana:]

#signal-item("1", "Datos Personales", "Escribe su nombre completo, correo electrónico y su número de WhatsApp para enviarle su acceso.", color: gold)

#signal-item("2", "Elige su Cargo / Rol", "Selecciona si será Mesero de Sala, Control de Puerta, Finanzas o Gerente.", color: emerald)

#signal-item("3", "Selecciona sus Zonas de Mesas", "Marca las casillas de las zonas que atenderá (ej. 'VIP Stage', 'Palco', 'Dance Floor').", color: cyan)

#signal-item("4", "Guardar e Invitar", "Presiona 'Guardar Colaborador'. El sistema generará una contraseña temporal para que ingrese desde su celular.", color: purple)

#v(3pt)
#tip-box("Contraseña Temporal", "Copia la contraseña que aparece en pantalla y envíasela por WhatsApp. Al entrar por primera vez, el sistema le pedirá cambiarla por una propia.")

#pagebreak()

// ==========================================
// PÁGINA 5: PASO 3 — SEGURIDAD Y REGLAS DE ORO
// ==========================================

#step-title("3", "Control de Acceso y Recomendaciones para la Noche", "Todo tu personal conectado y trabajando en equipo durante el evento.")

#v(3pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  Durante la noche, cada integrante del equipo usa su propio teléfono o tablet para que la operación fluya:
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
      #text(weight: "bold", size: 8.8pt, fill: emerald)[En la Puerta] \
      #v(2pt)
      El portero abre el escáner y lee los pases QR. La mesa cambia a verde en la pantalla de la barra al segundo.
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
      #text(weight: "bold", size: 8.8pt, fill: cyan)[En las Mesas] \
      #v(2pt)
      El mesero atiende únicamente las mesas de su zona y despacha botellas con el método de 2 toques.
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
      #text(weight: "bold", size: 8.8pt, fill: purple)[En la Caja] \
      #v(2pt)
      El cajero cobra el saldo pendiente y cierra la cuenta. El dinero queda cuadrado sin faltantes.
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
  #text(weight: "bold", size: 8.8pt, fill: rgb("#92400e"))[SEGURIDAD: CERO ROBO DE IDENTIDAD] \
  #v(1pt)
  #text(size: 8.4pt, fill: rgb("#78350f"))[
    Cada acción que realiza un empleado (marcar un check-in en puerta, tomar un pedido o cerrar una cuenta) queda registrada con su nombre y hora exacta. Si ocurre cualquier diferencia de caja, el dueño sabe al segundo qué usuario intervino.
  ]
]

#v(8pt)
#text(size: 11pt, weight: "black", fill: dark-slate)[Los 4 Consejos de Oro para Gestionar a tu Personal]
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
      *1. Un usuario para cada empleado:* \
      No permitas que dos meseros compartan la misma cuenta para evitar confusiones de pedidos.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *2. Revisa las zonas antes de abrir:* \
      Confirma a las 9:30 PM que cada mesero tenga asignadas sus mesas antes de que empiece a llegar la gente.
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
      *3. Suspende cuentas inactivas:* \
      Si un mesero ya no labora en el local, suspéndelo el lunes por la mañana para mantener limpio el sistema.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *4. Capacitación de 5 minutos:* \
      El sistema es tan sencillo que un mesero nuevo aprende a usarlo en 5 minutos mirando esta guía.
    ]
  ]
)

#v(10pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Guía de Operaciones Prácticas para Dueños y Gerentes de Negocios Nocturnos]
]
