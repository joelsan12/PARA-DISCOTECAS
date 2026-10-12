// NIGHTFLOW VIP — MANUAL TÉCNICO COMPLETO PARA OPERACIONES Y SISTEMAS
// Módulo de Cartelera de Eventos (EventsManager)
// Alineado con AGENTS.md §1, §2 y §7

#set document(
  title: "Manual Técnico de Operaciones y Sistemas — Cartelera de Eventos",
  author: "NIGHTFLOW VIP Engineering Team",
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
        text(size: 8pt, fill: rgb("#64748b"), weight: "bold")[NIGHTFLOW VIP · MANUAL DE OPERACIONES & SISTEMAS],
        text(size: 8pt, fill: rgb("#b48c36"), weight: "bold")[CARTELERA DE EVENTOS & GESTIÓN DE AFOROS]
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
        text(size: 8pt, fill: rgb("#94a3b8"))[Confidencial · Propiedad de Ingeniería & Operaciones de Plataforma],
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

#let gold = rgb("#d97706")
#let dark-gold = rgb("#92400e")
#let emerald = rgb("#059669")
#let border-color = rgb("#e2e8f0")
#let slate = rgb("#0f172a")

#let section-header(num, title) = [
  #v(8pt)
  #rect(
    width: 100%,
    fill: slate,
    radius: 6pt,
    inset: (x: 12pt, y: 8pt)
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 10pt,
      align: horizon,
      [
        #box(
          fill: gold,
          radius: 4pt,
          inset: (x: 8pt, y: 4pt),
          text(fill: white, size: 8.5pt, weight: "black")[SECCIÓN #num]
        )
      ],
      [
        #text(fill: white, size: 11pt, weight: "bold")[#title]
      ]
    )
  ]
  #v(6pt)
]

#let callout(title: "NOTA DE ARQUITECTURA", body, color: gold) = [
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

// ==========================================
// PORTADA TÉCNICA
// ==========================================

#align(center + horizon)[
  #rect(
    width: 100%,
    fill: rgb("#060911"),
    radius: 10pt,
    inset: (x: 30pt, y: 42pt),
    stroke: 2pt + rgb("#d97706")
  )[
    #text(size: 15pt, weight: "black", fill: rgb("#e5b54f"), tracking: 4pt)[NIGHTFLOW VIP] \
    #v(3pt)
    #text(size: 8.5pt, weight: "bold", fill: rgb("#94a3b8"), tracking: 2pt)[ENTERPRISE CLOUD ARCHITECTURE · OPERATIONS MANUAL]

    #v(25pt)
    #line(length: 70%, stroke: 1.5pt + rgb("#d97706"))
    #v(18pt)

    #text(size: 23pt, weight: "black", fill: white)[MANUAL TÉCNICO DE SISTEMAS] \
    #v(6pt)
    #text(size: 15pt, weight: "bold", fill: rgb("#e5b54f"))[Módulo Cartelera de Eventos & Tarifas Dinámicas] \
    #v(10pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Especificación del Modelo de Datos Firestore, Ciclo de Vida del Evento, \
      Propagación de Tarifarios por Mesa y Reglas de Seguridad Multi-Tenant.
    ]

    #v(25pt)
    #line(length: 70%, stroke: 1.5pt + rgb("#d97706"))
    #v(25pt)

    #grid(
      columns: (1fr, 1fr, 1fr, 1fr),
      gutter: 8pt,
      align: center,
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[COMPONENTE] \
        #text(size: 9pt, weight: "bold", fill: white)[EventsManager.tsx]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[COLECCIÓN] \
        #text(size: 9pt, weight: "bold", fill: rgb("#38bdf8"))[`events`]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[OPERACIÓN] \
        #text(size: 9pt, weight: "bold", fill: rgb("#34d399"))[`upsertEvent`]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[ZONA HORARIA] \
        #text(size: 9pt, weight: "bold", fill: rgb("#fbbf24"))[America/Guayaquil]
      ]
    )
    #v(15pt)
  ]
]

#pagebreak()

// ==========================================
// SECCIÓN 1: ARQUITECTURA Y ESTADO
// ==========================================

#section-header("1", "Arquitectura del Componente y Jerarquía")

El módulo de gestión de eventos reside en `src/components/club/dashboard/EventsManager.tsx` y opera como la autoridad central de fechas y tarifas temporales del establecimiento.

```text
src/components/club/dashboard/EventsManager.tsx
├── EventCardsGrid          <-- Lista de eventos activos con badges de publicación y horarios
├── EventModal (Create/Edit)<-- Formulario modal con validación y carga de metadatos
├── EventPricingManager     <-- Vinculación con eventPricing para asociar mesas físicas
└── VisibilityToggle        <-- Mutación atómica del flag is_published en Firestore
```

#v(4pt)
#text(size: 9.5pt, weight: "bold", fill: slate)[1.1 Modelo de Datos `ClubEvent` en Firestore]
Los eventos se almacenan en la subcolección particionada `businesses/{businessId}/events/{eventId}`:

```json
{
  "id": "evt_2026_10_sabado_vip",
  "club_id": "club_barahunda",
  "title": "Black Carpet VIP Edition",
  "subtitle": "La fiesta de electrónica más exclusiva del mes",
  "date": "2026-10-24",
  "day_label": "SÁBADO 24 OCT",
  "door_time": "22:00",
  "cover_price": 25.00,
  "dj_guest": "DJ Marco Carola (Special Set)",
  "genre": "Tech House / Melodic Techno",
  "flyer_url": "https://storage.googleapis.com/.../flyer_20261024.webp",
  "is_published": true,
  "createdAt": "2026-10-12T15:30:00.000Z",
  "updatedAt": "2026-10-12T15:32:10.000Z"
}
```

#v(6pt)
#section-header("2", "Ciclo de Vida y Asociación con Tarifarios de Mesa")

Cada evento actúa como un contenedor de precios transitorio. Al crearse un evento:
1. El backend (`upsertBusinessEventRemote`) replica o inicializa los registros de `businesses/{businessId}/eventPricing/{pricingId}` vinculando cada `table_id` del local con un `min_spend` y `deposit_required` específico para esa noche.
2. Si un negocio decide cobrar un cover más alto o duplicar el consumo mínimo de las mesas para un DJ internacional, la modificación aplica exclusivamente a ese `eventId` sin alterar la configuración física base de las mesas.

#callout(title: "INMUTABILIDAD DE RESERVAS YA CONFIRMADAS", [
  Cualquier mutación en `cover_price` o tarifas de mesa en un evento ya publicado afecta únicamente a transacciones futuras. Las reservas con estado `CONFIRMED` o `HELD` congelan el precio en el instante de la transacción para garantizar integridad fiscal y cumplimiento con la Ley de Protección al Consumidor.
])

#v(6pt)
#section-header("3", "Seguridad, Multi-Tenancy y Permisos RBAC")

- **Aislamiento Multi-Tenant:** Las consultas se restringen a `where('club_id', '==', activeClub.id)` mediante reglas de seguridad de Firestore.
- **Roles Autorizados:** Solo el personal con roles `owner` y `manager` tiene privilegios de escritura (`write`) sobre la colección `events`. Personal de puerta (`door`) o meseros (`waiter`) solo tienen permisos de lectura (`read`).

#v(15pt)
#align(center)[
  #text(size: 8.5pt, fill: rgb("#94a3b8"))[NIGHTFLOW VIP Enterprise Platform · Manual de Arquitectura de Eventos · Octubre 2026]
]
