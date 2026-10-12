// NIGHTFLOW VIP — MANUAL OPERATIVO DEL DISEÑADOR DE PLANO ARQUITECTÓNICO
// Configuración de tipografía y formato de documento

#set document(
  title: "Manual Operativo — Diseñador de Plano Arquitectónico",
  author: "NIGHTFLOW VIP Engineering & Product Team",
  date: auto
)

#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 2.2cm, right: 2.2cm),
  header: context {
    if here().page() > 1 [
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[NIGHTFLOW VIP · MANUAL OPERATIVO DE SALA],
        text(size: 8pt, fill: rgb("#b48c36"), weight: "bold")[DISEÑADOR DE PLANO ARQUITECTÓNICO]
      )
      #line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
    ]
  },
  footer: context {
    if here().page() > 1 [
      #line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
      #v(3pt)
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8pt, fill: rgb("#94a3b8"))[Confidencial · Propiedad de Operaciones del Establecimiento],
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

// Constantes y estilos de diseño Nightflow VIP
#let gold = rgb("#d97706")
#let dark-gold = rgb("#92400e")
#let emerald = rgb("#059669")
#let border-color = rgb("#e2e8f0")

#let vip-badge(txt, color: gold) = [
  #box(
    fill: color.lighten(85%),
    stroke: 0.5pt + color,
    radius: 4pt,
    inset: (x: 6pt, y: 2.5pt),
    text(size: 7.5pt, weight: "bold", fill: color.darken(20%))[#txt]
  )
]

#let callout(title: "NOTA OPERATIVA", body, color: gold) = [
  #v(4pt)
  #rect(
    width: 100%,
    fill: color.lighten(94%),
    stroke: (left: 3pt + color, rest: 0.5pt + color.lighten(70%)),
    radius: (right: 6pt),
    inset: (x: 10pt, y: 7pt)
  )[
    #text(size: 8.5pt, weight: "bold", fill: color.darken(25%))[#title] \
    #v(2pt)
    #text(size: 8.8pt, fill: rgb("#334155"))[#body]
  ]
  #v(4pt)
]

#let step-header(num, title) = [
  #v(6pt)
  #rect(
    width: 100%,
    fill: rgb("#0f172a"),
    radius: 6pt,
    inset: (x: 12pt, y: 8pt)
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
          text(fill: white, size: 8.5pt, weight: "black")[#upper(num)]
        )
      ],
      [
        #text(fill: white, size: 11pt, weight: "bold")[#title]
      ]
    )
  ]
  #v(4pt)
]

#let figure-box(img-path, caption-text) = [
  #align(center)[
    #rect(
      stroke: 1pt + rgb("#cbd5e1"),
      radius: 6pt,
      inset: 4pt,
      fill: rgb("#0b0f19")
    )[
      #image(img-path, width: 95%)
    ]
    #v(2pt)
    #text(size: 8.2pt, fill: rgb("#64748b"), style: "italic")[*Captura:* #caption-text]
  ]
]

// ==========================================
// PÁGINA 1: PORTADA EJECUTIVA
// ==========================================

#align(center + horizon)[
  #rect(
    width: 100%,
    fill: rgb("#090c13"),
    radius: 12pt,
    inset: (x: 28pt, y: 36pt),
    stroke: 1.5pt + rgb("#e5b54f")
  )[
    #v(10pt)
    #text(size: 14pt, weight: "black", fill: rgb("#e5b54f"), tracking: 4pt)[NIGHTFLOW VIP] \
    #v(4pt)
    #text(size: 8.5pt, weight: "bold", fill: rgb("#94a3b8"), tracking: 2pt)[OPERATING SYSTEM FOR CLUBS & VIP VENUES]
    
    #v(35pt)
    #line(length: 70%, stroke: 1.5pt + rgb("#e5b54f"))
    #v(20pt)

    #text(size: 24pt, weight: "black", fill: white)[MANUAL OPERATIVO DEL\ DISEÑADOR DE PLANO] \
    #v(12pt)
    #text(size: 11pt, fill: rgb("#cbd5e1"))[Guía Integral y de Negocio para Dueños de Clubes, Directores de Operaciones, Capitanes de Meseros y Concierges]
    
    #v(20pt)
    #line(length: 70%, stroke: 1.5pt + rgb("#e5b54f"))
    #v(35pt)

    #grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 12pt,
      align: center,
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[CASO PRÁCTICO] \
        #text(size: 9.5pt, weight: "bold", fill: rgb("#e5b54f"))[Club Edificio]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[DISTRIBUCIÓN REAL] \
        #text(size: 9.5pt, weight: "bold", fill: white)[Herradura VIP (12 Mesas)]
      ],
      [
        #text(size: 8pt, fill: rgb("#94a3b8"))[VERSIÓN DEL SISTEMA] \
        #text(size: 9.5pt, weight: "bold", fill: rgb("#34d399"))[v2.4 Spark/Live]
      ]
    )
    #v(10pt)
  ]
]

#pagebreak()

// ==========================================
// PÁGINA 2: INTRODUCCIÓN Y CASO DE ESTUDIO
// ==========================================

= 1. Introducción & Arquitectura del Módulo

El **Diseñador de Plano Arquitectónico** de *NIGHTFLOW VIP* es el módulo neurálgico donde los dueños de discotecas, clubes nocturnos, lounges y salas de conciertos configuran la distribución física y comercial de su sala.

A diferencia de los sistemas de reserva tradicionales basados en listas estáticas de texto, NIGHTFLOW VIP utiliza un **lienzo cenital interactivo con coordenadas vectoriales (SVG) sincronizadas en tiempo real**. Esto genera una ventaja competitiva inmediata:

1. *El Cliente VIP:* Selecciona visualmente su mesa preferida en el mapa cenital, conociendo su proximidad exacta a la cabina del DJ, la pista o los accesos privados.
2. *El Personal de Puerta & Sala:* Identifica al instante el estado de cada mesa (*Disponible*, *En Hold de 12 min*, *Reservada*, *En Sala* o *Cerrada*).
3. *La Administración Financiera:* Asigna reglas de consumo mínimo en USD, depósitos de anticipo y cupos de pases VIP incluidos por cada mesa.

#callout(
  title: "POLÍTICA DE ROLES & SEGURIDAD (AGENTS.MD §2 & §13)",
  [El acceso a este módulo requiere el rol de *Administrador del Club* o *Dueño* con la funcionalidad `FLOOR_PLAN` habilitada en su plan de suscripción. Toda alteración de coordenadas, capacidades o tarifas queda registrada de manera inmutable en la bitácora de auditoría del club.]
)

== Características Clave del Diseñador

#table(
  columns: (1.2fr, 2.8fr),
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { white },
  stroke: 0.5pt + rgb("#e2e8f0"),
  inset: 6.5pt,
  align: (left, left),
  [#text(weight: "bold", fill: white)[Capacidad]], [#text(weight: "bold", fill: white)[Beneficio Operativo]],
  [*Arquetipos Listos*], [Plantillas preconfiguradas para macro-salas, anfiteatros, rooftops y lienzos libres sin requerir diseño desde cero.],
  [*Ajuste Láser (Imán 1%)*], [Cuadrícula inteligente con snap magnético que mantiene la simetría milimétrica entre mesas gemelas.],
  [*Inspector de Propiedades*], [Edición instantánea de código, aforo de personas, forma geométrica (círculo, cápsula, cuadrado, rectángulo) y color de zona.],
  [*Sincronización Atómica*], [Al guardar, el plano se replica en milisegundos en la base de datos operativa, el catálogo de reservas del cliente y la consola de puerta.]
)

#v(8pt)

= 2. Caso de Estudio: Configuración del Club "Edificio"

Para este manual, se configuró y validó el club oficial de pruebas del sistema: **Edificio** (Sede Guayaquil, ID: `club_15c5b4cf616b6cec`).

Se transformó una sala inicial vacía de 1 mesa en una **distribución ejecutiva de lujo de 12 mesas activas**, organizada por zonas estratégicas:
- *Balcón VIP Central:* 5 mesas tipo cápsula y circulares con vista cenital a la pista (VIP-01 a VIP-05).
- *Palcos Laterales (Este y Oeste):* 4 palcos cuadrados privados para grupos de 8 personas (PAL-01 a PAL-04).
- *Front Stage DJ:* 2 mesas VIP situadas a los costados de la cabina del DJ (STAGE-01 y STAGE-02).
- *Pista Arena:* 1 mesa central de alto impacto en la zona de baile (PST-01).

#pagebreak()

// ==========================================
// PÁGINA 3: PASO 1 (PLANTILLAS)
// ==========================================

= 3. Procedimiento Paso a Paso con Capturas

#step-header("Paso 1", "Acceso al Diseñador y Selección de Plantilla de Arquetipo")

Para comenzar a modelar o renovar tu sala:

1. Ingresa a la **Consola Operativa** de tu establecimiento (`http://localhost:5174/` o tu dominio administrativo en producción).
2. En el menú de navegación lateral izquierdo, dirígete a la sección *OPERACIONES DE SALA* y haz clic en *Diseñador de Plano*.
3. En la barra superior de control, haz clic en el botón *Plantillas* (identificado con el icono de cuadrícula y capas).
4. Se desplegará el modal interactivo de *Plantillas de Arquetipos Arquitectónicos*.
5. Revisa las cuatro tipologías disponibles:
   - *Herradura VIP y sala principal (12 mesas):* Distribución en U con balcón VIP elevado, pista central y cabina del DJ frontal.
   - *Anfiteatro en U tipo estadio (14 mesas):* Gradas concéntricas escalonadas frente a escenario de conciertos.
   - *Suites Urbanas con vista panorámica (9 mesas):* Suites rectangulares privadas y terraza rooftop abierta.
   - *Plano personalizado (Lienzo en blanco):* Cuadrícula limpia para proyectos a medida desde cero.

#figure-box(
  "img/01_plantillas_arquetipos.png",
  "Modal de selección de arquetipos arquitectónicos con previsualización vectorial en miniatura."
)

#callout(
  title: "RECOMENDACIÓN ARQUITECTÓNICA",
  [Si tu club dispone de una zona VIP perimetral que balconea la pista de baile, el arquetipo *Herradura VIP* ofrece la mayor tasa de conversión comercial para botellas premium y reservas de grupos corporativos.]
)

#pagebreak()

// ==========================================
// PÁGINA 4: PASO 2 (LIENZO CARGADO)
// ==========================================

#step-header("Paso 2", "Carga del Arquetipo en el Lienzo y Exploración Espacial")

Una vez identificado el arquetipo deseado para tu sala:

1. Haz clic en el botón dorado *Cargar esta plantilla* ubicado en la tarjeta seleccionada (en este caso, *Herradura VIP*).
2. El modal se cerrará automáticamente y el lienzo cargará las 12 mesas posicionadas con rigurosa simetría sobre el plano arquitectónico.
3. Observa los elementos de orientación espacial integrados en el fondo cenital:
   - *ZONA VIP Superior:* Balcón elevado donde descansan las mesas VIP-01 a VIP-05.
   - *CABINA DJ:* Estructura frontal en la base del balcón con mesas Stage contiguas.
   - *PISTA DE BAILE:* Área central abierta libre de obstáculos.
4. El indicador de cabecera actualizará su conteo a: *12 mesas activas* y el switch de *Imán 1%: Activado* garantizará que cualquier desplazamiento con el mouse mantenga alineación milimétrica.

#figure-box(
  "img/02_lienzo_herradura_cargado.png",
  "Lienzo arquitectónico con las 12 mesas cargadas y calibradas simétricamente."
)

#callout(
  title: "MODO DRAG & DROP SENSIBLE AL TACTO",
  [Puedes hacer clic sostenido (o toque táctil en tablets) sobre cualquier mesa para moverla libremente. Las líneas guía láser invisibles ajustan la mesa al 1% de la cuadrícula más cercana.]
)

#pagebreak()

// ==========================================
// PÁGINA 5: PASO 3 (INSPECTOR DE MESAS)
// ==========================================

#step-header("Paso 3", "Inspección de Mesas y Personalización Fina de Propiedades")

Cada mesa individual es un recurso comercial autónomo. Para inspeccionar o modificar sus propiedades:

1. Haz clic directamente sobre cualquier mesa en el mapa (por ejemplo, la mesa central `VIP-03`).
2. La mesa quedará resaltada con un halo dorado de selección activa y el panel derecho *Inspector de Mesas* mostrará su ficha técnica completa.
3. Modifica los parámetros según tu estrategia de la noche:
   - *Código de Mesa:* Identificador único de inventario (ej. `VIP-03`).
   - *Etiqueta en Plano (Corta):* Número visible dentro de la figura en el mapa (ej. `3`).
   - *Zona del Club:* Categoría de ubicación (ej. *Palco Presidencial*, *Escenario VIP*, *Terraza*).
   - *Capacidad (Personas):* Aforo permitido (ej. `14 personas` con botones de selección rápida de 2p a 12p).
   - *Forma Geométrica:* Elige entre *Círculo*, *Cápsula* (ideal para salitas lounge alargadas), *Cuadrado* o *Rectángulo*.
   - *Color de Categoría VIP:* Selecciona el tono distintivo (Oro VIP, Cian Pista, Magenta Palco, Esmeralda Stage).
4. *Acciones Rápidas:*
   - *Duplicar:* Crea un clon inmediato de la mesa con las mismas propiedades.
   - *Borrar:* Elimina la mesa del inventario (o pulsa la tecla Supr / Retroceso en el teclado).

#figure-box(
  "img/03_inspector_propiedades_mesa.png",
  "Inspector lateral derecho editando la mesa VIP-03 (Palco Presidencial para 14 personas)."
)

#pagebreak()

// ==========================================
// PÁGINA 6: PASO 4 (NUEVA MESA)
// ==========================================

#step-header("Paso 4", "Creación de Nuevas Mesas desde Cero con Visualizador en Vivo")

Si deseas añadir mesas adicionales que no formen parte del arquetipo base:

1. Haz clic en el botón dorado *+ Nueva Mesa* en la barra superior del diseñador.
2. Se abrirá la ventana emergente *Nueva Mesa VIP* con un **Visualizador en Vivo** en el cuadrante derecho.
3. Ingresa los datos requeridos:
   - *Código de Mesa:* Por ejemplo `VIP-10` o `TERRAZA-01`.
   - *Identificador corto:* Número para el centro de la mesa (ej. `10`).
   - *Zona del Club:* Asigna la zona correspondiente.
   - *Capacidad:* Número de invitados admitidos.
   - *Consumo Mínimo (USD):* Monto en consumo requerido para reservar (ej. `$800`).
   - *Anticipo / Hold (USD):* Depósito obligatorio para apartar en pasarela (ej. `$200`).
   - *Forma Geométrica & Color:* Visualiza cómo luce en el simulador en vivo antes de confirmarlo.
4. Haz clic en el botón dorado *Insertar en Plano*. La mesa aparecerá en el centro del lienzo lista para ser arrastrada a su posición definitiva.

#figure-box(
  "img/04_modal_nueva_mesa.png",
  "Modal de creación rápida con previsualizador interactivo y campos comerciales de anticipo."
)

#pagebreak()

// ==========================================
// PÁGINA 7: PASO 5 (GUARDADO)
// ==========================================

#step-header("Paso 5", "Guardado, Validación y Sincronización con Inventario")

Una vez que la distribución física y comercial de las mesas esté a tu entera satisfacción:

1. Haz clic en el botón verde/dorado *Guardar Plano* en la barra superior.
2. El sistema iniciará la sincronización en background:
   - Valida la integridad de coordenadas e identificadores únicos.
   - Actualiza la colección en Firestore y emite un evento de auditoría interna (`PRESET_APPLIED` o `LAYOUT_UPDATED`).
   - Refresca el inventario de preventa y holds para los clientes en línea en menos de 500 ms.
3. El sistema desplegará el mensaje toast de confirmación en la esquina superior derecha: \
   *«Plano e inventario operativo sincronizados con éxito.»*

#figure-box(
  "img/05_guardado_sincronizacion.png",
  "Confirmación en pantalla tras la sincronización atómica del plano e inventario."
)

#callout(
  title: "PERSISTENCIA SIN RECARGAS FORZADAS",
  [El guardado es no destructivo. Si tienes clientes en la sala en ese momento, sus reservas activas se conservan intactas en sus códigos de mesa asignados.]
)

#pagebreak()

// ==========================================
// PÁGINA 8: PASO 6 (SALA & CONCIERGE EN VIVO)
// ==========================================

#step-header("Paso 6", "Puesta en Marcha: Vista en 'Sala & Concierge'")

Una vez guardado el plano, este cobra vida inmediatamente en los módulos operativos del club:

1. En el menú lateral izquierdo, haz clic en la pestaña *Sala & Concierge*.
2. Verás la cabecera ejecutiva actualizada:
   - *Mesas Disponibles:* `12 / 12` (100% capacidad libre al inicio de la noche).
   - *Holds Temporales (12 min):* Muestra transacciones de clientes en curso en tiempo real.
   - *Confirmadas / Puerta:* Contabiliza accesos validados mediante código QR dinámico.
3. En el centro se renderiza el **Plano Cenital Interactivo**, idéntico a lo diseñado, donde el personal puede hacer clic en cualquier mesa para inspeccionar comanda, consumo y peticiones de concierge.
4. En la columna derecha, el **Estado Operativo de Mesas** desglosa cada unidad con su nombre, capacidad, anticipo y consumo mínimo exigido.

#figure-box(
  "img/06_sala_concierge_operativa.png",
  "Módulo Sala & Concierge operando en vivo con las 12 mesas sincronizadas."
)

#pagebreak()

// ==========================================
// PÁGINA 9: TARIFARIO Y MATRIZ DE RECOMENDACIÓN
// ==========================================

= 4. Políticas Comerciales, Consumos Mínimos & Anticipos

El diseñador de plano no es solo una herramienta visual; es el **motor de monetización** del establecimiento. La configuración correcta de cada zona previene pérdidas y maximiza el ingreso medio por cliente (Ticket Promedio).

== Matriz de Recomendación por Zona (Caso Edificio)

#table(
  columns: (1.2fr, 0.7fr, 0.8fr, 0.9fr, 2.1fr),
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { white },
  stroke: 0.5pt + rgb("#e2e8f0"),
  inset: 5.5pt,
  align: (left, center, right, right, left),
  [#text(weight: "bold", fill: white)[Zona / Mesa]],
  [#text(weight: "bold", fill: white)[Aforo]],
  [#text(weight: "bold", fill: white)[Anticipo]],
  [#text(weight: "bold", fill: white)[Consumo Mín.]],
  [#text(weight: "bold", fill: white)[Incluye en la Experiencia]],
  
  [*Palco Presidencial (VIP-03)*], [14 pers.], [USD 300], [USD 1,200], [14 Pases VIP, 2 Botellas Ultra Premium, Guardia dedicado],
  [*Balcón Central (VIP 01, 02, 04, 05)*], [10 pers.], [USD 200], [USD 800], [10 Pases VIP, 1 Botella Premium, Atención prioritaria],
  [*Palcos Laterales (PAL 01 a 04)*], [8 pers.], [USD 150], [USD 600], [8 Pases VIP, 1 Botella Premium, Acceso preferencial],
  [*Front Stage DJ (STAGE 01, 02)*], [8 pers.], [USD 200], [USD 900], [8 Pases VIP, 1 Botella Ultra, Ubicación exclusiva DJ],
  [*Pista Arena (PST-01)*], [6 pers.], [USD 100], [USD 450], [6 Pases VIP, Consumo convertible en barra]
)

#v(8pt)

#callout(
  title: "REGLA DE LIBERACIÓN DE STOCK (HOLDS DE 12 MINUTOS)",
  [Cuando un cliente en la web o app selecciona una mesa para reservar, el sistema coloca automáticamente la mesa en estado *HOLD* durante exactamente 12 minutos. Si la pasarela de pago no confirma la transacción en ese plazo, el ticker de servidor libera la mesa de inmediato para otros clientes, evitando bloqueos maliciosos sin intervención del personal.]
)

== Directrices para Maximizar Facturación

1. *Diferenciación Visual de Tiers:* Utiliza colores cálidos (Oro VIP `#e5b54f` y Ámbar `#f59e0b`) para las mesas de mayor consumo y colores fríos (Cian y Esmeralda) para mesas de pista o consumo regular.
2. *Cupo de Pases Proporcional:* Nunca otorgues más de 1.2 pases por plaza de asiento físico para evitar la saturación de pasillos de servicio y garantizar la comodidad del cliente que paga la botella.
3. *Anticipo No Reembolsable (Hold):* Exigir entre el 20% y el 30% del consumo mínimo en anticipo asegura una tasa de asistencia (*no-show rate*) inferior al 3% en noches de alta demanda.

#pagebreak()

// ==========================================
// PÁGINA 10: GUÍA RÁPIDA Y SOPORTE DE PLANOS A MEDIDA
// ==========================================

= 5. Hoja de Referencia Rápida para el Personal

Esta hoja puede imprimirse y colocarse en el punto de atención del Capitán de Sala, Meseros y Recepción.

== Código de Colores de Estado de Mesas en Sala en Vivo

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #rect(width: 100%, stroke: 0.5pt + rgb("#cbd5e1"), radius: 5pt, inset: 7pt)[
      #vip-badge("DISPONIBLE", color: rgb("#64748b")) \
      #v(2pt)
      *Gris Suave:* Mesa libre sin reserva previa ni hold. Puede asignarse a clientes walk-in en puerta.
    ]
  ],
  [
    #rect(width: 100%, stroke: 0.5pt + rgb("#cbd5e1"), radius: 5pt, inset: 7pt)[
      #vip-badge("HOLD (12 MIN)", color: rgb("#f59e0b")) \
      #v(2pt)
      *Ámbar Parpadeante:* Cliente en proceso de checkout web. No vender en puerta hasta que expire.
    ]
  ],
  [
    #rect(width: 100%, stroke: 0.5pt + rgb("#cbd5e1"), radius: 5pt, inset: 7pt)[
      #vip-badge("RESERVADA", color: rgb("#e5b54f")) \
      #v(2pt)
      *Dorado VIP:* Anticipo pagado exitosamente. Invitados ingresan con QR dinámico en puerta.
    ]
  ],
  [
    #rect(width: 100%, stroke: 0.5pt + rgb("#cbd5e1"), radius: 5pt, inset: 7pt)[
      #vip-badge("EN SALA", color: rgb("#059669")) \
      #v(2pt)
      *Verde Esmeralda:* Clientes dentro de la sala con comanda y atención de mesero activa.
    ]
  ]
)

== Atajos de Teclado del Diseñador

- *Arrastrar con Puntero:* Mueve mesas libremente con precisión magnética (snap to grid 1%).
- *Clic en Mesa:* Abre sus propiedades en el Inspector Lateral.
- *Tecla Supr / Retroceso:* Elimina de inmediato la mesa seleccionada.
- *Duplicar (Botón Lateral):* Crea una réplica exacta con desplazamiento offset de 3%.
- *Guardar Plano:* Sincroniza al instante con todas las tablets y pantallas de concierge.

== ¿Tienes un Local con Arquitectura Compleja?

Si tu club posee varios niveles, desniveles irregulares, columnas históricas, piscinas o jardines exteriores, no necesitas diseñarlo manualmente:

#align(center)[
  #rect(
    width: 95%,
    fill: rgb("#0b0e14"),
    stroke: 1pt + rgb("#e5b54f"),
    radius: 8pt,
    inset: 12pt
  )[
    #text(weight: "black", fill: rgb("#e5b54f"), size: 10.5pt)[SERVICIO DE PLANOS A MEDIDA NIGHTFLOW VIP] \
    #v(3pt)
    #text(fill: white, size: 8.8pt)[Haz clic en *Solicitar Plano a Medida* dentro del modal de plantillas. Nuestro equipo de arquitectos digitales vectorizará tu plano en CAD o PDF con precisión milimétrica y efectos de iluminación neón exclusivos para tu marca.]
  ]
]

#v(15pt)
#align(center)[
  #text(size: 8pt, fill: rgb("#94a3b8"))[Documento técnico generado por NIGHTFLOW VIP Platform · Edición Oficial · Octubre 2026]
]
