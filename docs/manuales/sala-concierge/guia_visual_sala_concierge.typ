// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS Y GERENTES
// Módulo de Sala en Vivo y Pedidos VIP (Concierge)
// Lenguaje 100% claro, sencillo y directo para personas de negocio

#set document(
  title: "Guía Visual Práctica — Sala en Vivo y Pedidos VIP",
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
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[SALA EN VIVO & PEDIDOS DE MESAS]
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

// Colores de la marca Nightflow VIP
#let gold = rgb("#d97706")
#let dark-gold = rgb("#92400e")
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
// PÁGINA 1: PORTADA ELEGANTE VIP
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
    #text(size: 14pt, weight: "bold", fill: rgb("#e5b54f"))[Control de Sala en Vivo y Pedidos de Botellas] \
    #v(8pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Aprende a manejar tu local en tiempo real desde una tablet: \
      mira qué mesas están ocupadas, atiende pedidos de clientes al instante \
      y cobra las cuentas sin confusiones ni pérdidas de dinero.
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
        #text(size: 9pt, weight: "bold", fill: rgb("#e5b54f"))[Cero pérdidas en la noche]
      ]
    )
    #v(10pt)
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 2: ¿PARA QUÉ SIRVE ESTA PANTALLA?
// ==========================================

#text(size: 14pt, weight: "black", fill: dark-slate)[¿Para qué sirve esta pantalla y cómo te ayuda?]
#v(2pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  Durante una noche llena en la discoteca, los papelitos con pedidos se pierden, los meseros no saben qué clientes ya llegaron a sus mesas y la caja se vuelve un enredo al cobrar. Esta pantalla soluciona todo eso reuniendo en un solo lugar:
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
      #text(weight: "bold", size: 9.5pt, fill: gold)[1. El Mapa de tus Mesas en Vivo] \
      #v(2pt)
      Ves todo tu local desde arriba. Cada mesa tiene un color que te avisa si está vacía, si ya llegó el cliente, si está reservada o si ya pagaron la cuenta final.
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
      #text(weight: "bold", size: 9.5pt, fill: emerald)[2. Pedidos Directos desde la Mesa] \
      #v(2pt)
      El cliente puede pedir botellas, hielo o bengalas desde su celular. La orden aparece al segundo en tu pantalla para que el mesero la lleve volando.
    ]
  ]
)

#v(8pt)
#text(size: 11pt, weight: "bold", fill: dark-slate)[La Diferencia Entre la Forma Antigua y la Forma Moderna]
#v(3pt)

#table(
  columns: (1.5fr, 2.5fr, 2.5fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 5.5pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[SITUACIÓN EN LA NOCHE],
    text(fill: white, weight: "bold", size: 8pt)[CÓMO SE HACÍA ANTES (CAOS)],
    text(fill: white, weight: "bold", size: 8pt)[CÓMO SE HACE HOY CON NIGHTFLOW]
  ),

  [Saber si un cliente llegó],
  [Ir caminando hasta la puerta a preguntarle al guardia de seguridad.],
  [*Miras tu tablet:* la mesa se pone verde apenas el portero escanea el pase.],

  [Pedido de una botella extra],
  [El cliente llama al mesero a gritos y se anota en una servilleta mojada.],
  [*Llega al celular de barra:* el mesero la entrega en menos de 2 minutos.],

  [Cobrar la cuenta de la mesa],
  [Sumar a mano y discutir con el cliente si ya había pagado anticipo.],
  [*Cierre automático:* el sistema descuenta el anticipo y da el saldo exacto.]
)

#v(8pt)
#tip-box("Usa una Tablet en Barra o Caja", "Solo necesitas colocar una tablet sencilla en la barra principal o en la estación de los capitanes. No necesitas computadoras caras ni cables especiales.")

#pagebreak()

// ==========================================
// PÁGINA 3: PASO 1 — VISTA GENERAL DE LA SALA
// ==========================================

#step-title("1", "Mira Todo tu Local en una Sola Pantalla", "Aprende a leer lo que pasa en tu discoteca con una sola mirada.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_sala_en_vivo_control.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Las 4 cosas que debes conocer en tu pantalla:]

#signal-item("1", "Botón para Cambiar de Vista", "Te permite alternar con un toque entre ver el 'Mapa de Mesas' o la 'Lista de Pedidos'.", color: gold)

#signal-item("2", "Resumen de la Noche en Vivo", "Los números de arriba te dicen cuántas personas ya entraron al local, cuántas mesas están ocupadas y cuántas libres.", color: emerald)

#signal-item("3", "Mapa de tus Mesas con Luces", "Toca con el dedo cualquier mesa para ver quién la reservó, cuántos amigos están sentados y cuánto dinero van consumiendo.", color: cyan)

#signal-item("4", "Lista de Mesas en la Sala", "Panel de la derecha con todas las mesas, su capacidad de personas, el consumo mínimo exigido y los anticipos ya cobrados.", color: gold)

#v(3pt)
#tip-box("Revisión Rápida de Gerencia", "El gerente puede mirar esta pantalla cada 30 minutos para saber de inmediato qué zonas del club se están llenando más rápido.")

#pagebreak()

// ==========================================
// PÁGINA 4: PASO 2 — LOS COLORES DE LAS MESAS
// ==========================================

#step-title("2", "Los 5 Colores de tus Mesas (El Semáforo de la Noche)", "Cada mesa se ilumina con un color diferente para que sepas qué hacer al instante.")

#v(3pt)

#table(
  columns: (1.2fr, 2.2fr, 2.8fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { dark-slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 6pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[COLOR DE LA MESA],
    text(fill: white, weight: "bold", size: 8pt)[QUÉ SIGNIFICA],
    text(fill: white, weight: "bold", size: 8pt)[QUÉ DEBE HACER TU EQUIPO]
  ),

  [
    #box(fill: rgb("#064e3b"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#34d399"), weight: "bold", size: 7.8pt)[● VERDE ESMERALDA])
  ],
  [
    *Cliente Adentro* \
    El cliente ya pasó por la puerta, el portero lo registró y ya está sentado en la mesa.
  ],
  [
    El mesero asignado debe acercarse de inmediato a saludar, destapar su botella de bienvenida y empezar la atención.
  ],

  [
    #box(fill: rgb("#78350f"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#fde68a"), weight: "bold", size: 7.8pt)[● DORADO VIP])
  ],
  [
    *Mesa Reservada* \
    La mesa ya fue pagada o apartada por la página web, pero el cliente aún no llega al local.
  ],
  [
    La mesa debe estar lista, con sus copas y cubeta puestas. *No se le puede dar a otra persona bajo ninguna circunstancia.*
  ],

  [
    #box(fill: rgb("#854d0e"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#fed7aa"), weight: "bold", size: 7.8pt)[● ÁMBAR / NARANJA])
  ],
  [
    *Comprando en Internet (12 min)* \
    Un cliente está pagando con su tarjeta en la web en este momento. La mesa está apartada.
  ],
  [
    El sistema protege la mesa durante 12 minutos. Si el cliente no completa el pago, la mesa se desocupa sola automáticamente.
  ],

  [
    #box(fill: rgb("#581c87"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#e9d5ff"), weight: "bold", size: 7.8pt)[● MORADO REAL])
  ],
  [
    *Cuenta Pagada y Cerrada* \
    La mesa ya pagó su cuenta final en la caja del club y el cobro quedó cerrado.
  ],
  [
    El equipo de limpieza puede recoger las copas usadas y dejar la mesa lista para recibir a otro grupo si la noche sigue activa.
  ],

  [
    #box(fill: rgb("#334155"), radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(fill: rgb("#cbd5e1"), weight: "bold", size: 7.8pt)[● GRIS CLARO])
  ],
  [
    *Mesa Libre* \
    Mesa completamente desocupada y sin ninguna reserva para la noche de hoy.
  ],
  [
    Disponible para vender a los clientes que van llegando directo a la puerta sin reserva, cobrando el consumo mínimo.
  ]
)

#v(8pt)
#tip-box("Regla de Oro para Porteros y Capitanes", "Si una mesa está en Dorado o Naranja, nadie del personal puede sentar a otros clientes ahí. Si la persona en la web no termina de pagar, la mesa cambiará a Gris por sí sola.")

#pagebreak()

// ==========================================
// PÁGINA 5: PASO 3 — TOCAR UNA MESA Y VER LA CUENTA
// ==========================================

#step-title("3", "Toca Cualquier Mesa para Ver su Cuenta y Pedidos", "Con un solo toque con el dedo sabes exactamente quién está sentado y qué necesita.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_02_inspeccion_mesa_comanda.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Qué pasa cuando tocas una mesa en el mapa:]

#signal-item("1", "Mesa Iluminada", "Al tocar una mesa (por ejemplo la VIP-03), se enciende con un círculo luminoso para que sepas cuál estás revisando.", color: gold)

#signal-item("2", "Datos de la Mesa", "Aparece la tarjeta con el número de mesa, la zona donde está ubicada (ej. Palco Presidencial) y para cuántas personas es.", color: emerald)

#signal-item("3", "Pedidos Directos de esa Mesa", "Muestra si esa mesa ha pedido asistencia del mesero, más hielo, bengalas o botellas sin tener que buscarla en listas largas.", color: cyan)

#signal-item("4", "Consumo Acumulado vs Mínimo", "Ves al instante cuánto dinero lleva consumido el cliente y si ya cubrió el consumo mínimo que prometió gastar.", color: gold)

#v(3pt)
#tip-box("Saber Cuánto Falta de Consumo", "Si una mesa tenía un consumo mínimo de $300 y solo van pidiendo $180, el mesero puede sugerirles otra botella antes de que termine la noche.")

#pagebreak()

// ==========================================
// PÁGINA 6: PASO 4 — ATENCIÓN DE PEDIDOS VIP
// ==========================================

#step-title("4", "Atiende Pedidos de Botellas sin Perder Tiempo", "Los clientes piden desde su celular y a tu personal le llega la orden en 2 segundos.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 5pt,
    inset: 2pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_03_cola_concierge_atencion.png", width: 78%)
  ]
]

#v(2pt)
#text(weight: "bold", size: 9.2pt, fill: dark-slate)[Cómo funciona la pantalla de pedidos (Concierge):]

#signal-item("1", "Modo Pedidos Activado", "Al tocar el botón 'Piso & Concierge' arriba a la derecha, la pantalla cambia para mostrar la lista de pedidos en vivo.", color: gold)

#signal-item("2", "Filtros Fáciles", "Puedes ver: 'Todas', 'Pendientes' (los pedidos nuevos que acaban de llegar), 'En atención' y 'Completadas'.", color: cyan)

#signal-item("3", "Lista de Pedidos en Tiempo Real", "Cada tarjeta te dice qué mesa pide, qué botella quieren (ej. 'Champaña con bengala') y cuántos minutos llevan esperando.", color: emerald)

#signal-item("4", "Mapa de Ayuda", "A la izquierda mantienes el mapa de tu local para que el mesero nuevo sepa exactamente dónde queda la mesa y no se pierda.", color: purple)

#v(4pt)
#rect(
  width: 100%,
  fill: rgb("#f8fafc"),
  stroke: 0.5pt + rgb("#cbd5e1"),
  radius: 4pt,
  inset: (x: 8pt, y: 5pt)
)[
  #text(weight: "bold", size: 8.8pt, fill: dark-slate)[El Método de 2 Toques para Entregar Botellas Rápido:] \
  #v(1pt)
  #text(size: 8.4pt, fill: rgb("#334155"))[
    *1. Primer toque ("En atención"):* El mesero toca el botón apenas ve el pedido. La tarjeta cambia a color naranja para avisar a todos que la botella ya se está buscando en la barra. \
    *2. Segundo toque ("Completada"):* Cuando la botella ya está puesta con sus copas y bengalas en la mesa, el mesero presiona "Completada" y desaparece de la lista.
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 7: PASO 5 Y REGLAS DE ORO
// ==========================================

#step-title("5", "Cómo Cobrar y Cerrar la Cuenta sin Equivocarte", "Cero pérdidas de dinero: el sistema descuenta solo lo que el cliente ya pagó de anticipo.")

#v(3pt)
#text(size: 9.2pt, fill: rgb("#475569"))[
  Cuando un grupo pide la cuenta o se va a retirar del club, el capitán o cajero realiza el cierre en solo 3 pasos:
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
      #text(weight: "bold", size: 8.8pt, fill: gold)[1. Toca la Mesa] \
      #v(2pt)
      Toca la mesa en el mapa y presiona el botón *«Cerrar Cuenta»* (o *«Saldar Cuenta»*).
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
      #text(weight: "bold", size: 8.8pt, fill: emerald)[2. Elige Cómo Pagan] \
      #v(2pt)
      Selecciona cómo pagan el saldo pendiente:
      - *Efectivo* (Billetes en caja)
      - *Tarjeta* (Punto de venta / POS)
      - *Transferencia bancaria*
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
      #text(weight: "bold", size: 8.8pt, fill: purple)[3. Presiona Confirmar] \
      #v(2pt)
      El sistema calcula el saldo restando el anticipo que pagaron por la web y la mesa pasa a color *Morado*.
    ]
  ]
)

#v(6pt)
#rect(
  width: 100%,
  fill: rgb("#fffbeb"),
  stroke: (left: 3pt + rgb("#d97706"), rest: 0.5pt + rgb("#fef3c7")),
  radius: (right: 5pt),
  inset: (x: 10pt, y: 6pt)
)[
  #text(weight: "bold", size: 8.8pt, fill: rgb("#92400e"))[SEGURIDAD PARA TU DINERO: SOLO PERSONAL AUTORIZADO PUEDE COBRAR] \
  #v(1pt)
  #text(size: 8.4pt, fill: rgb("#78350f"))[
    Por seguridad de tu negocio, los meseros comunes no pueden cerrar cuentas desde su teléfono. Solo el dueño, el gerente o el cajero tienen permiso para registrar el cobro final. Así tienes la seguridad de que cada dólar que entra al club queda registrado.
  ]
]

#v(8pt)
#text(size: 11pt, weight: "black", fill: dark-slate)[Los 4 Consejos de Oro para tu Noche]
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
      *1. Tablet fija en la barra:* \
      Ten una tablet con la pantalla de pedidos abierta en la barra de tragos para que las botellas salgan sin retrasos.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *2. Respeta los 12 min de espera:* \
      Si una mesa está en naranja, espera los 12 minutos. Si el cliente no termina de pagar en internet, se desocupará sola.
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
      *3. Cero pedidos en papelitos:* \
      Todo trago o botella extra debe marcarse en el sistema para que no haya faltantes de botellas al hacer el inventario.
    ]
    #v(3pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 4pt,
      inset: 7pt
    )[
      *4. Cierra la cuenta apenas se vayan:* \
      Apenas los clientes paguen y se retiren, marca la mesa como cerrada para saber si tienes espacio para nuevos clientes.
    ]
  ]
)

#v(10pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Guía de Operaciones Prácticas para Dueños y Gerentes de Negocios Nocturnos]
]
