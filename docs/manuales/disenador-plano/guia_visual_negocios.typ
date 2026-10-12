// NIGHTFLOW VIP — GUÍA VISUAL PRÁCTICA PARA DUEÑOS DE CLUBES Y NEGOCIOS
// "Crea el Plano de tu Discoteca o Lounge en 5 Minutos" (Sin tecnicismos)

#set document(
  title: "Guía Visual Práctica — Diseña el Plano de tu Club",
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
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[NIGHTFLOW VIP · GUÍA PRÁCTICA PARA NEGOCIOS],
        text(size: 8pt, fill: rgb("#d97706"), weight: "bold")[CÓMO CREAR EL PLANO DE TU SALA]
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
        text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP · Diseñado para Dueños, Gerentes y Capitanes de Sala],
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

// Colores de lujo Nightflow VIP
#let gold = rgb("#d97706")
#let emerald = rgb("#059669")
#let dark-slate = rgb("#0f172a")

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
    #text(size: 8.5pt, weight: "bold", fill: rgb("#065f46"))[TIP PARA TU NEGOCIO: #title] \
    #text(size: 8.8pt, fill: rgb("#047857"))[#text-content]
  ]
  #v(4pt)
]

// ==========================================
// PORTADA VISUAL
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

    #v(30pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(18pt)

    #text(size: 25pt, weight: "black", fill: white)[GUÍA VISUAL PASO A PASO] \
    #v(8pt)
    #text(size: 14pt, weight: "bold", fill: rgb("#e5b54f"))[Cómo Crear y Configurar el Plano de tu Local en Minutos] \
    #v(10pt)
    #text(size: 10pt, fill: rgb("#cbd5e1"))[Guía práctica 100% visual para dueños, gerentes y organizadores de eventos nocturnos. \ Sin términos técnicos: solo lo que necesitas saber para vender tus mesas hoy mismo.]

    #v(20pt)
    #line(length: 60%, stroke: 1.5pt + rgb("#d97706"))
    #v(30pt)

    #grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 10pt,
      align: center,
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[TIEMPO ESTIMADO] \
        #text(size: 10pt, weight: "bold", fill: white)[Menos de 5 minutos]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[DIFICULTAD] \
        #text(size: 10pt, weight: "bold", fill: rgb("#34d399"))[Fácil / Visual]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[RESULTADO] \
        #text(size: 10pt, weight: "bold", fill: rgb("#e5b54f"))[Plano en Vivo 100% Listo]
      ]
    )
    #v(15pt)
  ]
]

#pagebreak()

// ==========================================
// PASO 1: ELIGE TU PLANTILLA
// ==========================================

#step-title("1", "Elige el Estilo que Mejor se Parezca a tu Local", "No necesitas dibujar nada desde cero. Nightflow VIP ya tiene los modelos más exitosos listos.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_01_elegir_plantilla.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales de lo que debes hacer en pantalla:]
#v(2pt)

#signal-item("1", "Elige el diseño de tu club", "Si tu local tiene mesas alrededor de la pista y balcón, la plantilla 'Herradura VIP' es perfecta.")
#signal-item("2", "Haz clic en 'Cargar esta plantilla'", "Con solo este clic, el sistema acomodará 12 mesas en su lugar exacto de forma instantánea.")
#signal-item("3", "Otras opciones de salas", "Si tienes un escenario para conciertos, una terraza abierta o quieres acomodar las mesas una por una, puedes elegir los otros modelos.")

#tip-box("VENTA DE BOTELLAS", "Los clubes que muestran un plano con balcón elevado y cabina DJ venden hasta un 40% más rápido sus mesas de alto consumo porque el cliente sabe exactamente qué tan cerca estará de la fiesta.")

#pagebreak()

// ==========================================
// PASO 2: RECONOCE EL MAPA DE TU SALA
// ==========================================

#step-title("2", "Mira tu Salón Cenital y Mueve Mesas a tu Gusto", "Todo en la pantalla se puede mover con el mouse o con el dedo desde una tablet.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_02_mapa_y_zonas.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales en pantalla:]
#v(2pt)

#signal-item("1", "Contador de mesas activas", "Arriba verás cuántas mesas tienes registradas (en este ejemplo, 12 mesas listas para la noche).")
#signal-item("2", "Balcón VIP Elevado", "Aquí están ubicadas las mesas VIP-01 a VIP-05, ideales para cobrar un consumo más alto.")
#signal-item("3", "Cabina del DJ", "El centro del show. Las mesas pegadas al DJ son las primeras que buscan los clientes más exclusivos.")
#signal-item("4", "¡Mueve lo que quieras!", "Haz clic sostenido sobre cualquier mesa y arrástrala. El imán automático las mantendrá alineadas para que tu plano se vea siempre profesional.")

#tip-box("ESPACIOS CÓMODOS", "Deja espacio libre entre la cabina y la pista para que los meseros y la seguridad circulen cómodamente sin chocar con los clientes.")

#pagebreak()

// ==========================================
// PASO 3: CAMBIA NOMBRES, CUPO Y PRECIOS
// ==========================================

#step-title("3", "Ponle Nombre, Capacidad y Categoría a Cada Mesa", "Toca cualquier mesa en el mapa y cambia sus datos en el panel de la derecha.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_03_cambiar_precio_y_cupo.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales en pantalla:]
#v(2pt)

#signal-item("1", "Toca una mesa en el plano", "Al tocarla, se encenderá con un halo dorado para saber cuál estás editando.")
#signal-item("2", "Inspector Lateral", "A la derecha se abre automáticamente la ficha de esa mesa.")
#signal-item("3", "Nombre y Número", "Escribe cómo la conoce tu equipo: ej. 'Mesa VIP-03', 'Palco 1' o 'Mesa Presidencial'.")
#signal-item("4", "¿Cuántas personas entran?", "Toca los botones rápidos: 4, 6, 8, 10 o 14 personas. Ese será el número de pases VIP incluidos.")
#signal-item("5", "Forma y Color", "Elige si es redonda, alargada (cápsula) o rectangular, y dale su color de zona (Dorado, Cian, Magenta, Verde).")

#tip-box("DUPLICAR EN 1 SEGUNDO", "¿Tienes 4 mesas idénticas seguidas? Configura la primera y toca el botón 'Duplicar'. Te ahorrarás minutos valiosos de trabajo.")

#pagebreak()

// ==========================================
// PASO 4: CREA UNA NUEVA MESA
// ==========================================

#step-title("4", "¿Quieres Agregar una Mesa Más? Hazlo en 1 Minuto", "Solo llena 3 datos básicos y mírala en el simulador en vivo antes de soltarla en tu sala.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_04_crear_nueva_mesa.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales en pantalla:]
#v(2pt)

#signal-item("1", "Nombre de la Mesa", "Escribe el nombre con el que el cliente la verá al reservar en su celular.")
#signal-item("2", "Consumo Mínimo en Dólares ($)", "¿Cuánto deben gastar en bebidas o botellas esa noche? (ej. $800).")
#signal-item("3", "Anticipo de Reserva ($)", "¿Cuánto deben pagar por adelantado para asegurar la mesa? (ej. $200 para evitar que no lleguen).")
#signal-item("4", "Simulador en Vivo", "A la derecha verás exactamente cómo lucirá tu mesa antes de agregarla.")
#signal-item("5", "Clic en 'Insertar en Plano'", "La mesa aparecerá en tu mapa para que la acomodes donde tú quieras.")

#tip-box("EVITA EL AUSENTISMO (NO-SHOWS)", "Pide siempre entre el 20% y 30% del consumo como anticipo. Los clientes que pagan anticipo asisten en el 98% de los casos.")

#pagebreak()

// ==========================================
// PASO 5: GUARDA Y APLICA EN TU NEGOCIO
// ==========================================

#step-title("5", "Guarda tu Plano y Sincroniza Todo con 1 Clic", "Al guardar, tus meseros, tu portero y tus clientes verán el plano actualizado al instante.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_05_guardar_plano.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales en pantalla:]
#v(2pt)

#signal-item("1", "¡Paso Final! Botón 'Guardar Plano'", "Haz clic en el botón verde superior cuando tu salón esté exactamente como te gusta.", color: emerald)
#signal-item("2", "Confirmación en Pantalla", "Verás el mensaje verde 'Plano e inventario operativo sincronizados con éxito'. Ya está todo en el sistema.")

#v(6pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[¿Qué pasa después de guardar?]
1. *En la web de tus clientes:* Tus clientes ya pueden entrar desde su celular, tocar la mesa que quieran y pagar su reserva.
2. *En la puerta del club:* El portero verá los QR de acceso generados específicamente para cada mesa.
3. *En las tablets de los meseros:* La sala se actualiza sola sin necesidad de reiniciar la app.

#tip-box("CAMBIOS DE ÚLTIMA HORA", "¿Moviste mesas porque un grupo VIP compró 2 juntas? Puedes entrar al diseñador, juntar las mesas y guardar en 10 segundos, incluso durante la noche.")

#pagebreak()

// ==========================================
// PASO 6: DISFRUTA LA OPERACIÓN EN VIVO
// ==========================================

#step-title("6", "Así Funciona tu Noche en 'Sala & Concierge'", "Controla aforo, reservas y pedidos de clientes sin enredos ni papel.")

#align(center)[
  #rect(
    stroke: 1pt + rgb("#cbd5e1"),
    radius: 6pt,
    inset: 3pt,
    fill: rgb("#0b0f19")
  )[
    #image("img_annotated/guia_06_plano_en_vivo_clientes.png", width: 95%)
  ]
]

#v(4pt)
#text(weight: "bold", size: 10.5pt, fill: dark-slate)[Señales en pantalla:]
#v(2pt)

#signal-item("1", "Pestaña 'Sala & Concierge'", "Es la pantalla que usarán tus capitanes de meseros durante toda la fiesta.")
#signal-item("2", "Aforo en Tiempo Real", "Arriba verás de un vistazo cuántas mesas te quedan libres (ej. 12 / 12 disponibles).")
#signal-item("3", "Plano Interactivo en Vivo", "Las mesas cambian de color automáticamente: Gris = Libre, Dorado = Reservada, Verde = Clientes en mesa.")
#signal-item("4", "Control de Consumos", "A la derecha ves qué mesa está pidiendo botellas y cuánto saldo tienen consumido.")

#v(10pt)
#align(center)[
  #rect(
    width: 90%,
    fill: rgb("#0b0f19"),
    stroke: 1pt + rgb("#d97706"),
    radius: 8pt,
    inset: 10pt
  )[
    #text(weight: "black", fill: rgb("#e5b54f"), size: 11pt)[¡FELICIDADES! TU CLUB ESTÁ LISTO PARA FACTURAR AL MÁXIMO] \
    #v(3pt)
    #text(fill: white, size: 8.8pt)[Con NIGHTFLOW VIP tu local opera con el mismo estándar visual que los mejores clubes de Las Vegas, Ibiza y Miami. ¡Que tengas una excelente noche de ventas!]
  ]
]

#v(10pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Nightflow VIP Platform · Guía Rápida para Establecimientos Nocturnos]
]
