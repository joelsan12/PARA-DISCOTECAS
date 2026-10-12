// NIGHTFLOW VIP — MANUAL TÉCNICO COMPLETO PARA OPERACIONES Y SISTEMAS
// Módulo de Personal, Meseros y Roles de Sala (StaffManager)
// Alineado con AGENTS.md §1, §2, §2.3 y §8

#set document(
  title: "Manual Técnico de Operaciones y Sistemas — Personal y Roles de Sala",
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
        text(size: 8pt, fill: rgb("#b48c36"), weight: "bold")[ADMINISTRACIÓN DE PERSONAL & RBAC]
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
    #text(size: 15pt, weight: "bold", fill: rgb("#e5b54f"))[Módulo Personal, Meseros & Roles de Sala] \
    #v(10pt)
    #text(size: 9.5pt, fill: rgb("#cbd5e1"))[
      Especificación del Modelo de Seguridad RBAC, Ciclo de Vida de Credenciales, \
      Custom Claims Mínimos, Zonificación de Mesas y Revocación Escalonada de Sesiones.
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
        #text(size: 9pt, weight: "bold", fill: white)[StaffManager.tsx]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[COLECCIÓN] \
        #text(size: 9pt, weight: "bold", fill: rgb("#38bdf8"))[`staff/{uid}`]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[JWT CLAIMS] \
        #text(size: 9pt, weight: "bold", fill: rgb("#34d399"))[< 300 Bytes]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#94a3b8"))[SEGURIDAD] \
        #text(size: 9pt, weight: "bold", fill: rgb("#fbbf24"))[AGENTS §2.3 / §8]
      ]
    )
    #v(15pt)
  ]
]

#pagebreak()

// ==========================================
// SECCIÓN 1: ARQUITECTURA Y ROLES
// ==========================================

#section-header("1", "Estructura del Componente y Modelo de Datos")

El componente `src/components/club/dashboard/StaffManager.tsx` gestiona la identidad y privilegios del personal dentro del espacio de nombres privado del club:

```json
{
  "uid": "usr_staff_8849b",
  "businessId": "club_barahunda",
  "name": "Sofía Paredes",
  "email": "sofia.staff@clubbarahunda.com",
  "whatsapp": "+593991234567",
  "role": "waiter | door | finance | manager | owner",
  "status": "ACTIVE | SUSPENDED | REVOKED",
  "assignedZones": ["VIP Stage", "Palco Presidencial"],
  "createdAt": "2026-10-10T12:00:00.000Z",
  "updatedAt": "2026-10-12T14:20:00.000Z"
}
```

#v(4pt)
#section-header("2", "Matriz de Privilegios RBAC y Custom Claims (AGENTS §2.3)")

De conformidad estricta con la Sección 2.3 de AGENTS.md, el token JWT de Firebase Auth solo contiene datos de alcance global (`platformRole` y `claimsVersion`), evitando exceder los 300 bytes. Los permisos específicos del club se resuelven contra Firestore en cada operación:

#v(3pt)
#table(
  columns: (1.5fr, 2.5fr, 2.5fr),
  stroke: (x, y) => if y == 0 { 1pt + rgb("#cbd5e1") } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { slate } else if calc.even(row) { rgb("#f8fafc") } else { white },
  inset: (x: 7pt, y: 5.5pt),
  align: horizon,

  table.header(
    text(fill: white, weight: "bold", size: 8pt)[ROL EN EL CLUB],
    text(fill: white, weight: "bold", size: 8pt)[PERMISOS EN FIRESTORE],
    text(fill: white, weight: "bold", size: 8pt)[ACCIONES EN LA INTERFAZ]
  ),

  [`owner`],
  [Acceso completo de lectura y escritura en todas las subcolecciones del negocio.],
  [Gestión de cuentas bancarias, pasarelas de pago, tarifas y configuración global.],

  [`manager`],
  [Lectura total; escritura en `events`, `resources`, `staff` y `conciergeRequests`.],
  [Supervisión de sala, asignación de zonas, resolución de incidentes de puerta.],

  [`finance`],
  [Lectura de reservas; ejecución de la Cloud Function `settleTableTab`.],
  [Cierre de comandas, recepción de pagos en efectivo/tarjeta y emisión de comprobantes.],

  [`door`],
  [Lectura de tickets; escritura en `attendanceSessions` vía Cloud Run.],
  [Escaneo de pases criptográficos JWS, registro de check-in y salidas temporales.],

  [`waiter`],
  [Lectura de reservas filtradas por `assignedZones`; actualización de `conciergeRequests`.],
  [Recepción de pedidos de botellas de sus mesas y cambio de estado a 'Completada'.]
)

#v(6pt)
#section-header("3", "Protocolo de Revocación y Botón de Pánico (AGENTS §8)")

- **Suspensión Inmediata:** Si una terminal o empleado queda comprometido, la mutación de `status` a `SUSPENDED` o `REVOKED` en `businesses/{businessId}/staff/{uid}` invalida instantáneamente su sesión mediante reglas de seguridad de Firestore en menos de 200 ms.
- **Revocación de Puerta:** El servicio de Cloud Run verifica el `revocationVersion` activo del negocio antes de procesar cualquier check-in online u offline.

#v(15pt)
#align(center)[
  #text(size: 8.5pt, fill: rgb("#94a3b8"))[NIGHTFLOW VIP Enterprise Platform · Manual de Arquitectura de Personal · Octubre 2026]
]
