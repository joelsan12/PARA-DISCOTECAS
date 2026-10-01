# BORRADOR — SUJETO A REVISIÓN JURÍDICA
# NO CONSTITUYE ASESORÍA LEGAL

# ACUERDO DE NIVEL DE SERVICIO (SLA)
## NIGHTFLOW VIP — DISPONIBILIDAD Y RENDIMIENTO DE LA PLATAFORMA

El presente Acuerdo de Nivel de Servicio (SLA) establece los compromisos de disponibilidad, tiempos de respuesta y resiliencia operativa garantizados por **NIGHTFLOW VIP** para los clubes y organizadores suscriptores.

---

### 1. OBJETIVOS DE DISPONIBILIDAD (UPTIME)
1.1. **Disponibilidad Mensual General:** NIGHTFLOW garantiza un compromiso de disponibilidad mensual del **99.5%** para sus servicios en la nube, excluyendo ventanas de mantenimiento programado.
1.2. **Franja Crítica Operativa:** Durante la franja horaria de máxima afluencia nocturna (**22:00 a 05:00 hora local** de jueves a domingo), la infraestructura mantiene prioridad de escalado automático para preservar la operatividad ininterrumpida de puerta y check-in.

---

### 2. SLA DE RENDIMIENTO Y LATENCIA
2.1. **Validación Criptográfica Local de Pases:** La verificación de firma digital asimétrica (Ed25519) en las terminales de puerta se ejecuta en un tiempo inferior a **cincuenta (50) milisegundos**.
2.2. **Confirmación Transaccional en Línea (Door Service):** Latencia percentil 95 (p95) inferior a **300 - 500 milisegundos** bajo condiciones estándar de conectividad de red.

---

### 3. RESILIENCIA Y OPERACIÓN OFFLINE
3.1. En caso de interrupción temporal de la conexión a Internet en el establecimiento:
   - Las terminales de puerta continúan operando de forma autónoma validando pases basados en la validez temporal del JWS y almacenando los check-ins en **IndexedDB local cifrada**.
   - Con soporte de **NIGHTFLOW Edge** en la red local del club, la sincronización entre múltiples puertas se coordina internamente sin depender de la nube.
   - Al restaurarse la conectividad, las colas se transmiten de forma idempotente sin riesgo de duplicar accesos.

---

### 4. NIVELES DE SEVERIDAD Y TIEMPOS DE RESPUESTA
| Nivel de Severidad | Descripción del Incidente | Tiempo de Respuesta | Objetivo de Mitigación |
|---|---|---|---|
| **P0 — Crítico** | Bloqueo total del control de puerta o imposibilidad de escanear pases en horario de evento. | < 15 minutos | < 1 hora |
| **P1 — Alto** | Degradación en el proceso de reserva en línea o problemas de webhook con el PSP. | < 45 minutos | < 3 horas |
| **P2 — Medio** | Errores en la interfaz de administración, generación de reportes o configuración no bloqueante. | < 4 horas | < 24 horas |
| **P3 — Bajo** | Consultas generales, solicitudes de mejora o ajustes cosméticos. | < 24 horas | Siguiente ciclo de versión |

---

### 5. VENTANAS DE MANTENIMIENTO PROGRAMADO
5.1. Las actualizaciones mayores y tareas de mantenimiento preventivo de infraestructura se programan exclusivamente en días y horarios de baja o nula actividad en clubes (lunes y martes entre las 04:00 y las 08:00 hora local), con un aviso previo mínimo de veinticuatro (24) horas al CLUB.
