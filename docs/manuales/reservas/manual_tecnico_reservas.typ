// NIGHTFLOW VIP — MANUAL TÉCNICO COMPLETO PARA OPERACIONES Y SISTEMAS
// Módulo de Reservas Activas y Check-In (ReservationsTable)
// Alineado con AGENTS.md §2, §6 y §7

#set document(
  title: "Manual Técnico de Operaciones y Sistemas — Reservas Activas",
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
        text(size: 8pt, fill: rgb("#b48c36"), weight: "bold")[GESTIÓN TRANSACCIONAL DE RESERVAS]
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
    #text(size: 15pt, weight: "bold", fill: rgb("#e5b54f"))[Módulo Reservas Activas & Check-In en Puerta] \
    #v(10pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Especificación de la Máquina de Estados de Reserva, Transacciones de Pago, \
      Normalización Telefónica E.164 y Protocolo de Asistencia Idempotente.
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
        #text(size: 9pt, weight: "bold", fill: white)[ReservationsTable.tsx]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[COLECCIÓN] \
        #text(size: 9pt, weight: "bold", fill: rgb("#38bdf8"))[`reservations`]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[IDEMPOTENCIA] \
        #text(size: 9pt, weight: "bold", fill: rgb("#34d399"))[`jti` / `ticketId`]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[TELEFONÍA] \
        #text(size: 9pt, weight: "bold", fill: rgb("#fbbf24"))[E.164 Ecuador]
      ]
    )
    #v(15pt)
  ]
]

#pagebreak()

// ==========================================
// SECCIÓN 1: ARQUITECTURA Y ESTADOS
// ==========================================

#section-header("1", "Estructura del Componente y Modelo de Datos")

El componente `src/components/club/dashboard/ReservationsTable.tsx` administra el ciclo de vida de los clientes con derecho a acceso y reserva de mesa.

```json
{
  "id": "res_8849af12",
  "club_id": "club_barahunda",
  "event_id": "evt_2026_10_sabado_vip",
  "table_id": "table_vip_03",
  "table_code": "VIP-03",
  "zone": "Palco Presidencial",
  "customer_name": "Carlos Mendoza",
  "customer_phone": "+593991234567",
  "customer_email": "carlos@example.com",
  "guest_count": 8,
  "status": "CONFIRMED | CHECKED_IN | HELD | CANCELLED",
  "payment_status": "paid | pending | failed | refunded",
  "payment_method": "payphone | stripe | cash_door",
  "deposit_amount": 150.00,
  "min_spend": 300.00,
  "ticketId": "tkt_ed25519_99410",
  "entryTime": "2026-10-24T23:15:02.100Z",
  "createdAt": "2026-10-20T14:10:00.000Z"
}
```

#v(4pt)
#section-header("2", "Máquina de Estados y Transición de Entrada")

```text
HELD ──(12 min / Checkout)──> CONFIRMED ──(Escaneo en puerta)──> CHECKED_IN
  │                             │
  └──(Timeout / Abandono)───────┴──(Cancelación / LOPDP)──> CANCELLED / REFUNDED
```

- **Transición a `CHECKED_IN`:** Ocurre cuando el portero escanea el pase criptográfico JWS. El endpoint de Cloud Run / Functions valida la firma asimétrica y actualiza atómicamente el documento en Firestore con `status: 'CHECKED_IN'` y registra `entryTime`.
- **Idempotencia en Puerta:** El identificador `ticketId` y `jti` impiden doble conteo de asistencia si la conexión sufre pérdidas de paquetes de red.

#v(6pt)
#section-header("3", "Normalización Telefónica y Seguridad Fiscal")

- **Teléfonos de Contacto:** Validados estrictamente con el estándar E.164 para Ecuador (`+593 9X XXX XXXX`).
- **Anonimización LOPDP:** Si un cliente solicita eliminación de datos bajo la LOPDP, los datos personales de la reserva se sustituyen por `subjectPseudonym`, preservando montos e impuestos para auditoría del SRI (AGENTS §9).

#v(15pt)
#align(center)[
  #text(size: 8.5pt, fill: rgb("#94a3b8"))[NIGHTFLOW VIP Enterprise Platform · Manual de Arquitectura de Reservas · Octubre 2026]
]
