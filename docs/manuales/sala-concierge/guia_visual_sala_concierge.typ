// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS Y GERENTES
// Módulo de Sala en Vivo y Concierge VIP (100% Visual y Práctico)

#set document(
  title: "Guía Visual Práctica — Módulo Sala y Concierge VIP",
  author: "NIGHTFLOW VIP",
  date: auto
)

#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2cm, right: 2cm),
  header: context {
    if here().page() > 1 [
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[NIGHTFLOW VIP · GUÍA PRÁCTICA PARA GERENTES Y DUEÑOS],
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[CONTROL DE SALA EN VIVO & CONCIERGE]
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
        text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Operación en Tiempo Real para Discotecas, Lounges y Bares],
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[Página #counter(page).display()]
      )
    ]
  }
)

#set text(
  font: ("Segoe UI", "Arial", "Helvetica"),
  size: 9.8pt,
  fill: rgb("#1e293b"),
  lang: "es"
)

#set par(
  justify: true,
  leading: 0.62em
)

// Paleta oficial Nightflow VIP
#let gold = rgb("#d97706")
#let dark-gold = rgb("#92400e")
#let emerald = rgb("#059669")
#let dark-slate = rgb("#0f172a")
#let cyan = rgb("#0284c7")
#let purple = rgb("#9333ea")

#let step-title(num, title, subtitle) = [
  #v(4pt)
  #rect(
    width: 100%,
    fill: rgb("#0b0f19"),
    radius: 7pt,
    inset: (x: 12pt, y: 8pt),
    stroke: 1pt + rgb("#d97706")
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 12pt,
      align: horizon,
      [
        #box(
          fill: rgb("#d97706"),
          radius: 5pt,
          inset: (x: 10pt, y: 5pt),
          text(fill: white, size: 10pt, weight: "black")[PASO #num]
        )
      ],
      [
        #text(fill: white, size: 12pt, weight: "bold")[#title] \
        #text(fill: rgb("#cbd5e1"), size: 8.5pt)[#subtitle]
      ]
    )
  ]
  #v(4pt)
]

#let signal-item(num, label, desc, color: gold) = [
  #rect(
    width: 100%,
    fill: rgb("#f8fafc"),
    stroke: 0.5pt + rgb("#e2e8f0"),
    radius: 5pt,
    inset: (x: 8pt, y: 6pt)
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 8pt,
      align: horizon,
      [
        #circle(
          radius: 9pt,
          fill: color,
          align(center + horizon, text(fill: white, size: 8pt, weight: "bold")[#num])
        )
      ],
      [
        #text(weight: "bold", size: 9pt, fill: rgb("#0f172a"))[#label: ]
        #text(size: 8.8pt, fill: rgb("#475569"))[#desc]
      ]
    )
  ]
  #v(2pt)
]

#let tip-box(title, text-content) = [
  #v(3pt)
  #rect(
    width: 100%,
    fill: rgb("#ecfdf5"),
    stroke: (left: 3pt + rgb("#059669"), rest: 0.5pt + rgb("#a7f3d0")),
    radius: (right: 5pt),
    inset: (x: 10pt, y: 6pt)
  )[
    #text(size: 8.5pt, weight: "bold", fill: rgb("#065f46"))[CONSEJO CLAVE PARA GERENCIA: #title] \
    #text(size: 8.8pt, fill: rgb("#047857"))[#text-content]
  ]
  #v(4pt)
]

// ==========================================
// PORTADA VISUAL VIP
// ==========================================

#align(center + horizon)[
  #rect(
    width: 100%,
    fill: rgb("#080b12"),
    radius: 12pt,
    inset: (x: 28pt, y: 38pt),
    stroke: 2pt + rgb("#d97706")
  )[
    #v(15pt)
    #text(size: 15pt, weight: "black", fill: rgb("#e5b54f"), tracking: 4pt)[NIGHTFLOW VIP] \
    #v(4pt)
    #text(size: 9pt, weight: "bold", fill: rgb("#94a3b8"), tracking: 2pt)[SISTEMA DE OPERACIONES & RESERVAS PARA CLUBES]

    #v(28pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(18pt)

    #text(size: 24pt, weight: "black", fill: white)[GUÍA VISUAL PRÁCTICA] \
    #v(8pt)
    #text(size: 15pt, weight: "bold", fill: rgb("#e5b54f"))[Módulo Sala en Vivo & Concierge VIP] \
    #v(10pt)
    #text(size: 10pt, fill: rgb("#cbd5e1"))[El centro neurálgico de tu discoteca: controla ocupación, mesas en sala, \ consumos acumulados y peticiones de botellas en tiempo real sin papel ni walkie-talkies.]

    #v(24pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(28pt)

    #grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 10pt,
      align: center,
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[DIRIGIDO A] \
        #text(size: 9.5pt, weight: "bold", fill: white)[Dueños, Gerentes y Capitanes]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[EXPERIENCIA TÉCNICA] \
        #text(size: 9.5pt, weight: "bold", fill: rgb("#34d399"))[Cero (100% Visual)]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[BENEFICIO] \
        #text(size: 9.5pt, weight: "bold", fill: rgb("#e5b54f"))[Cero Fugas & +30% Ventas]
      ]
    )
    #v(15pt)
  ]
]

#pagebreak()

// ==========================================
// INTRODUCCIÓN: ¿QUÉ ES SALA Y CONCIERGE?
// ==========================================

#text(size: 15pt, weight: "black", fill: dark-slate)[¿Qué es el Módulo de Sala y Concierge?]
#v(2pt)
#text(size: 9.5pt, fill: rgb("#475569"))[
  Durante la noche, el caos de las comandas en papel, las mesas sobrevendidas y los meseros buscando clientes a oscuras destruye la rentabilidad de un club. El módulo *Sala y Concierge* de Nightflow VIP unifica en una sola pantalla táctil:
]

#v(4pt)
#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 10pt
    )[
      #text(weight: "bold", size: 10pt, fill: gold)[1. Mapa Cenital en Vivo] \
      Ves tu discoteca desde arriba exactamente como está dispuesta. Cada mesa se enciende con halos de colores según si está libre, reservada, con el cliente ya adentro o con la cuenta saldada.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 10pt
    )[
      #text(weight: "bold", size: 10pt, fill: emerald)[2. Concierge & Pedidos VIP] \
      Los clientes en sus mesas piden botellas, hielo, bengalas o asistencia desde su teléfono. Los pedidos caen al instante en la cola para que tus corredores atiendan en menos de 90 segundos.
    ]
  ]
)

#v(8pt)

// ==========================================
// PASO 1: EL TABLERO DE CONTROL GENERAL
// ==========================================

#step-title("1", "El Tablero de Sala en Vivo y sus Señales", "Aprende a leer la pantalla principal en una sola mirada.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_sala_en_vivo_control.png", width: 95%)
  ]
]

#v(3pt)
#text(weight: "bold", size: 10pt, fill: dark-slate)[Señales clave que debes conocer en tu pantalla:]

#signal-item("1", "Selector de Modo", "Te permite alternar con un clic entre ver el 'Plano Cenital' o la 'Cola de Concierge'. Mantén esta pantalla fija en una tablet en barra o en la caja.", color: gold)

#signal-item("2", "Contadores de Presencia en Tiempo Real", "La barra superior te dice exactamente cuántas personas están físicamente dentro, cuántas mesas están en espera y cuántas están libres.", color: emerald)

#signal-item("3", "Plano Cenital con Halos en Vivo", "Tu discoteca en tiempo real. Al tocar cualquier mesa, se despliega de inmediato la comanda, quién la reservó y su saldo.", color: cyan)

#signal-item("4", "Lista Rápida de Mesas en Sala", "Panel lateral con la lista de mesas, su aforo, el consumo mínimo exigido y los anticipos ya recaudados en pasarela.", color: gold)

#tip-box("Tablets en Barra y Puerta", "Coloca una tablet económica de 10 pulgadas en la barra principal con esta pantalla abierta. El capitán de meseros sabrá qué mesas ya llegaron sin tener que ir a preguntar a la puerta.")

#pagebreak()

// ==========================================
// PASO 2: EL SEMÁFORO DE LA NOCHE
// ==========================================

#step-title("2", "El Semáforo de la Noche: Qué Significa Cada Color", "No necesitas memorizar códigos. Cada color te dice el estado de la mesa al instante.")

#v(4pt)

#table(
  columns: (1.2fr, 2.5fr, 2.8fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 8pt, y: 7pt),
  align: horizon,
  
  table.header(
    text(fill: white, weight: "bold", size: 8.5pt)[COLOR Y HALO],
    text(fill: white, weight: "bold", size: 8.5pt)[ESTADO OPERATIVO],
    text(fill: white, weight: "bold", size: 8.5pt)[QUÉ DEBE HACER TU PERSONAL]
  ),

  [
    #box(fill: rgb("#064e3b"), radius: 4pt, inset: (x: 6pt, y: 3pt), text(fill: rgb("#34d399"), weight: "bold", size: 8.2pt)[● VERDE ESMERALDA])
  ],
  [
    *Cliente en Sala (INSIDE)* \
    El cliente ya pasó por el portero, su QR fue escaneado y está ocupando la mesa físicamente.
  ],
  [
    El mesero asignado debe presentarse de inmediato, servir el anticipo de cortesía y abrir la cuenta de consumo.
  ],

  [
    #box(fill: rgb("#78350f"), radius: 4pt, inset: (x: 6pt, y: 3pt), text(fill: rgb("#fde68a"), weight: "bold", size: 8.2pt)[● DORADO VIP])
  ],
  [
    *Reserva Confirmada* \
    La mesa ya fue pagada o anticipada por la web. El cliente aún no llega a la discoteca.
  ],
  [
    La mesa debe mantenerse montada con su cubeta y copas de lujo. *Prohibido venderla a walk-ins sin orden de gerencia.*
  ],

  [
    #box(fill: rgb("#854d0e"), radius: 4pt, inset: (x: 6pt, y: 3pt), text(fill: rgb("#fed7aa"), weight: "bold", size: 8.2pt)[● ÁMBAR / NARANJA])
  ],
  [
    *Hold Activo (12 Minutos)* \
    Un cliente está en el proceso de pago por la página web. La mesa está bloqueada temporalmente.
  ],
  [
    El sistema la protege para evitar doble venta. Si el cliente no completa el pago en 12 min, se libera sola automáticamente.
  ],

  [
    #box(fill: rgb("#581c87"), radius: 4pt, inset: (x: 6pt, y: 3pt), text(fill: rgb("#e9d5ff"), weight: "bold", size: 8.2pt)[● MORADO REAL])
  ],
  [
    *Cuenta Cerrada (SETTLED)* \
    La mesa ya liquidó su comanda y el cobro final fue registrado en el sistema.
  ],
  [
    El equipo de limpieza puede retirar copas y preparar la mesa para rotación si aún restan horas de servicio.
  ],

  [
    #box(fill: rgb("#334155"), radius: 4pt, inset: (x: 6pt, y: 3pt), text(fill: rgb("#cbd5e1"), weight: "bold", size: 8.2pt)[● GRIS TRASLÚCIDO])
  ],
  [
    *Disponible* \
    Mesa completamente libre y sin reserva previa para el evento en curso.
  ],
  [
    Disponible para vender en puerta al cliente de última hora exigiendo el consumo mínimo estipulado.
  ]
)

#v(8pt)

// ==========================================
// PASO 3: INSPECCIONAR MESA Y COMANDA
// ==========================================

#step-title("3", "Toca una Mesa para Ver su Cuenta y Peticiones", "Con solo un toque sabes quién está sentado, qué ha consumido y qué necesita.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_02_inspeccion_mesa_comanda.png", width: 95%)
  ]
]

#v(3pt)
#signal-item("1", "Mesa Seleccionada con Halo", "Al pulsar sobre cualquier mesa (ej. VIP-03), se destaca con un borde luminoso y se activan sus controles.", color: gold)

#signal-item("2", "Ficha Operativa de la Mesa", "Aparece la tarjeta con el código de mesa, zona VIP (ej. Palco Presidencial) y la capacidad máxima de personas autorizadas.", color: emerald)

#signal-item("3", "Peticiones Directas de la Mesa", "Ves si esa mesa ha pedido asistencia, hielo, bengalas o botellas sin tener que buscar en la lista general.", color: cyan)

#signal-item("4", "Consulta Rápida de Inventario", "Verifica consumos mínimos y balance general de la sala para saber si el cliente alcanzó el consumo prometido.", color: gold)

#pagebreak()

// ==========================================
// PASO 4: MODO PISO & CONCIERGE
// ==========================================

#step-title("4", "Atender Peticiones VIP en la Cola de Concierge", "Elimina los gritos y la pérdida de tiempo: servicio de botella en menos de 2 minutos.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_03_cola_concierge_atencion.png", width: 95%)
  ]
]

#v(3pt)
#signal-item("1", "Modo Concierge Activado", "Al hacer clic en 'Piso & Concierge' en el selector superior, la pantalla se enfoca en la cola de pedidos de sala.", color: gold)

#signal-item("2", "Filtros de Atención Rápida", "Filtra por: 'Todas', 'Pendientes' (nuevos pedidos urgentes), 'En atención' y 'Completadas'.", color: cyan)

#signal-item("3", "Cola en Tiempo Real", "Cada tarjeta muestra el número de mesa, qué pidió (ej. 'Champaña Don Pérignon con bengala'), tiempo transcurrido y botón de acción.", color: emerald)

#signal-item("4", "Ubicación Espacial en el Mapa", "A la izquierda mantienes el plano de referencia para que el mesero nuevo sepa exactamente dónde queda la mesa solicitante.", color: purple)

#v(6pt)
#rect(
  width: 100%,
  fill: rgb("#f8fafc"),
  stroke: 1pt + rgb("#e2e8f0"),
  radius: 6pt,
  inset: 10pt
)[
  #text(weight: "bold", size: 10pt, fill: dark-slate)[El Flujo de 2 Toques para Meseros y Capitanes:] \
  #v(3pt)
  1. *Toque 1 ("En atención"):* El corredor o mesero toma la tarjeta de la cola. La tarjeta cambia a color ámbar para avisar al resto del equipo que ya se está preparando la botella en barra. \
  2. *Toque 2 ("Completada"):* Una vez entregada la botella con sus copas y bengalas en la mesa, el mesero pulsa "Completada". La solicitud desaparece de la cola y queda registrada con hora exacta.
]

#pagebreak()

// ==========================================
// PASO 5: CÓMO COBRAR Y CERRAR LA CUENTA
// ==========================================

#step-title("5", "Cómo Cobrar y Cerrar la Cuenta de una Mesa", "Cero fugas de dinero: conciliación entre anticipo web y consumo real en sala.")

#v(4pt)
#text(size: 9.5pt, fill: rgb("#475569"))[
  Al finalizar la noche o cuando el cliente solicita la cuenta, el capitán o cajero realiza el cierre directamente desde la tarjeta de la mesa en el sistema:
]

#v(4pt)
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 10pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 8pt
    )[
      #text(weight: "bold", size: 9pt, fill: gold)[1. Toca la Mesa] \
      #v(2pt)
      En el plano o en la lista, selecciona la mesa activa. Haz clic en el botón *«Cerrar Cuenta»* (o *«Saldar Cuenta»*).
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 8pt
    )[
      #text(weight: "bold", size: 9pt, fill: emerald)[2. Elige el Medio de Pago] \
      #v(2pt)
      Selecciona si el saldo pendiente se abona con:
      - *Efectivo* (Caja física)
      - *Tarjeta / Datáfono* (Voucher)
      - *Transferencia Bancaria*
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 6pt,
      inset: 8pt
    )[
      #text(weight: "bold", size: 9pt, fill: purple)[3. Confirmación & Cierre] \
      #v(2pt)
      El sistema descuenta automáticamente el anticipo pagado en la web, calcula el saldo neto y cambia la mesa a *«SETTLED»*.
    ]
  ]
)

#v(8pt)
#rect(
  width: 100%,
  fill: rgb("#fffbeb"),
  stroke: (left: 3pt + rgb("#d97706"), rest: 0.5pt + rgb("#fef3c7")),
  radius: (right: 6pt),
  inset: (x: 12pt, y: 8pt)
)[
  #text(weight: "bold", size: 9pt, fill: rgb("#92400e"))[IMPORTANTE: PROTECCIÓN CONTRA MANIPULACIÓN DE CAJA] \
  #v(2pt)
  #text(size: 8.8pt, fill: rgb("#78350f"))[
    Solo los usuarios con rol de *Administrador, Gerente o Cajero* tienen autorización para saldar cuentas. Los meseros regulares no pueden cerrar mesas sin autorización, garantizando que todo dólar que entra a la barra quede cuadrado en el balance final.
  ]
]

#v(10pt)

// ==========================================
// RESUMEN EJECUTIVO: LOS MANDAMIENTOS
// ==========================================

#text(size: 13pt, weight: "black", fill: dark-slate)[Los 5 Mandamientos para una Noche Exitosa]
#v(4pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 8pt
    )[
      *1. Pantalla fija en barra:* \
      Mantén una tablet fija en la barra de despacho con la cola de Concierge abierta para preparar los pedidos antes de que el cliente reclame.
    ]
    #v(4pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 8pt
    )[
      *2. Respeta los 12 min de Hold:* \
      Si una mesa está en naranja (Hold), no la vendas en puerta. Si el cliente desiste, se liberará sola en su pantalla exactamente a los 12 minutos.
    ]
  ],
  [
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 8pt
    )[
      *3. Cero comandas volando en servilletas:* \
      Todo pedido de botella o extra debe pasar por el sistema para garantizar el registro del inventario y del consumo mínimo.
    ]
    #v(4pt)
    #rect(
      width: 100%,
      fill: rgb("#f8fafc"),
      stroke: 0.5pt + rgb("#e2e8f0"),
      radius: 5pt,
      inset: 8pt
    )[
      *4. Cierre de cuenta inmediato:* \
      En cuanto una mesa pida la cuenta y se reciba el pago, márcala como 'Cerrada'. Así sabrás si tienes mesas listas para recibir a nuevos clientes.
    ]
  ]
)

#v(15pt)
#align(center)[
  #text(size: 8.5pt, fill: rgb("#94a3b8"))[Documento Oficial de Operaciones · NIGHTFLOW VIP Enterprise Platform · Versión 2.4]
]
