# Playbook Operativo: Control de Acceso y Puerta en Vivo (Fase D)
## NIGHTFLOW VIP — Modo Nube Híbrido con Móviles Propios del Negocio

Este manual describe el procedimiento estándar para la operación, provisión, seguridad y respuesta ante incidentes en el módulo de puerta de los clubes nocturnos beta de **NIGHTFLOW VIP**.

---

## 1. Arquitectura de Puerta en Modo Nube Híbrido

El sistema opera bajo una arquitectura de **baja latencia y cero hardware propietario externo**:
* **Backend de Puerta:** Microservicio Express montado sobre el proceso principal en Render (`/door`), validando firmas asimétricas **Ed25519** (pases de clientes) y **ES256** (terminales de porteros).
* **Terminales de Puerta:** Smartphones propios del club o del personal de seguridad (iOS Safari o Android Chrome) ejecutando la PWA de administración en `/admin`.
* **Criptografía de Pases (Ed25519):** Tokens JWS rotativos generados cada 30 segundos con una ventana máxima de expiración de 45 segundos.
* **Tolerancia a Fallos Offline:** Cola encriptada en **IndexedDB** local que almacena eventos de asistencia si la conexión a internet cae, sincronizando de forma idempotente por `jti` sin duplicar aforo al reconectar.
* **Coste de Infraestructura:** Operación continua dentro del tier gratuito de Render y Firebase Spark ($0/mes).

```text
┌─────────────────────────┐             JWS Ed25519 (≤ 45s)            ┌─────────────────────────┐
│     Móvil Cliente       │ ─────────────────────────────────────────> │     Móvil Portero       │
│  (Pase VIP Rotativo)    │                                            │  (PWA Admin / Módulo)   │
└─────────────────────────┘                                            └────────────┬────────────┘
                                                                                    │
                                                                   Firma ES256 de   │  Cola IndexedDB
                                                                   la Terminal      │  (si no hay red)
                                                                                    ▼
                                                                       ┌─────────────────────────┐
                                                                       │     Render Backend      │
                                                                       │  (/door/v1/attendance)  │
                                                                       └────────────┬────────────┘
                                                                                    │
                                                                                    ▼
                                                                       ┌─────────────────────────┐
                                                                       │     Cloud Firestore     │
                                                                       │  (attendanceSessions)   │
                                                                       └─────────────────────────┘
```

---

## 2. Provisión y Alta de Personal de Puerta

El personal de control de acceso requiere el rol `door` en la subcolección privada del club (`businesses/{businessId}/staff/{uid}`).

### 2.1 Alta Automática (Beta Clubs)
Para provisionar las cuentas de staff y porteros en los clubes beta (`club-sensorial`, `club-rumaj`, `club-velvet`):
```bash
npm run provision:production
```
* Asigna automáticamente el usuario principal como `owner` y el usuario secundario como `door`.
* Si deseas especificar correos o UIDs concretos:
```bash
PROVISION_ADMIN_UID="<uid_dueño>" PROVISION_DOOR_UID="<uid_portero>" npm run provision:production
```

### 2.2 Verificación de Permisos
Un usuario con rol `door`:
* **Tiene acceso exclusivo** al escáner de pases, lista de check-in en puerta y botón de pánico de su terminal.
* **No puede** modificar tarifas, invitar personal, ver métricas financieras ni alterar planos de mesas (cumplimiento AGENTS.md §2.1 y §10).

---

## 3. Instalación de la PWA en Móviles del Negocio

No es necesario descargar apps desde la App Store ni Google Play. La PWA se instala directamente desde el navegador del dispositivo:

### 3.1 En iPhone / iPad (iOS Safari)
1. Abrir **Safari** y navegar a `https://nightflow-vip.web.app/admin` (o dominio del negocio).
2. Tocar el botón **Compartir** (icono de cuadrado con flecha hacia arriba en la barra inferior).
3. Seleccionar **«Añadir a pantalla de inicio»** (Add to Home Screen).
4. Nombrar el icono como **NIGHTFLOW Puerta** y pulsar **Añadir**.
5. Abrir la app desde el nuevo icono en la pantalla de inicio.
6. Iniciar sesión con la cuenta de portero asignada (`door@...`).
7. Seleccionar la pestaña **Check-in / Door** en el menú superior o lateral.

> **Importante para iOS:** Al solicitar permisos de cámara, presionar **«Permitir»**. Si la cámara no inicia de inmediato, presionar el botón *«Reintentar cámara»* o verificar en *Ajustes > Safari > Cámara > Permitir*.

### 3.2 En Android (Google Chrome)
1. Abrir **Chrome** y acceder a `https://nightflow-vip.web.app/admin`.
2. Presionar el menú de tres puntos (arriba a la derecha) o el banner inferior: **«Instalar aplicación»** / **«Añadir a pantalla principal»**.
3. Abrir la app desde el icono instalado.
4. Conceder permisos de cámara cuando el navegador lo solicite.

---

## 4. Enrolamiento Automático de la Terminal

1. Al acceder al módulo de puerta por primera vez en un dispositivo, la aplicación genera un par de claves criptográficas **ES256** dentro del enclave seguro del navegador (IndexedDB).
2. Se asigna un identificador único a la terminal: `dev-gate-<timestamp>-<hash>`.
3. La PWA envía la clave pública al backend vía `POST /door/v1/devices/enroll`.
4. El identificador de la terminal queda visible en la esquina superior del módulo de puerta (badge verde: **«TERMINAL ENROLADA»**).
5. Todas las validaciones de acceso que realice este guardia serán firmadas con la clave privada local, garantizando trazabilidad e impidiendo la suplantación de terminales.

---

## 5. Operación en Puerta: Flujo de Ingreso y Reingreso

### 5.1 Check-In Inicial (Pase VIP / Entrada)
1. El cliente muestra su pase en pantalla desde la PWA del cliente (`/negocio/:slug` o vista de reserva).
2. El guardia apunta la cámara al QR.
3. El sistema valida el pase en **< 50 milisegundos**:
   * Algoritmo `EdDSA` (Ed25519) verificado con la clave pública del club.
   * Ventana temporal vigente (`exp ≤ 45s`).
   * Reserva en estado `CONFIRMED`.
4. **Pantalla Verde:** «ACCESO CONCEDIDO». El aforo se incrementa en +1 y el estado del titular pasa a `INSIDE`.
5. Si alguien intenta ingresar con el mismo pase o una foto reenviada:
   * **Pantalla Roja:** «RECHAZADO: El titular ya está dentro del establecimiento» (`ALREADY_INSIDE`).

### 5.2 Salida Temporal (Fumar, llamada, vehículo)
1. El cliente se acerca al portero antes de salir.
2. El portero cambia el modo del escáner a **«Salida Temporal»** y escanea el pase.
3. El estado del titular pasa a `OUTSIDE_TEMPORARY`.
4. Se inicia un contador de **30 minutos de gracia** (`reentryExpiresAt`).
5. La PWA del cliente genera un desafío **Passkey / WebAuthn** vinculado a los datos biométricos (FaceID / TouchID / huella) del teléfono original.

### 5.3 Reingreso Legítimo vs Intento de Préstamo
* **Reingreso legítimo:** El cliente regresa dentro de los 30 minutos, presenta el pase y su teléfono firma el desafío con su enclave de hardware. La pantalla del portero se ilumina en verde: **«REINGRESO APROBADO»** (`INSIDE`).
* **Intento de pase prestado:** Si el cliente tomó una captura de pantalla y se la envió a un amigo por WhatsApp, el teléfono del amigo **no tiene la passkey en su enclave**. Al escanearlo, el sistema rechaza el reingreso con alerta roja.
* **Tiempo expirado:** Si transcurren más de 30 minutos, el sistema alerta: *«Ventana de reingreso superada. Requiere cobro de cover o autorización de administración»*.

---

## 6. Botón de Pánico y Revocación Escalonada

En situaciones de riesgo, incidentes de seguridad o robo de un dispositivo:

### Nivel 1: Guardia / Portero (Botón de Pánico SOS)
* En la pantalla del escáner hay un botón rojo **«BOTÓN DE PÁNICO (SOS)»**.
* **Acción:** Presionar el botón dos veces en un intervalo de 5 segundos.
* **Efecto Inmediato:**
  1. La terminal se **autobloquea localmente**; la cámara se apaga y el escáner se suspende.
  2. Se envía una llamada de emergencia a Cloud Functions / Render (`emergencyRevoke` con `scope: 'DEVICE'`).
  3. El backend marca el `deviceId` como revocado. Cualquier lectura posterior desde este dispositivo será rechazada de inmediato (`TOKEN_REVOKED`).

### Nivel 2: Administrador / Encargado del Club (`owner` / `manager`)
* Desde el panel administrativo (`/admin`), el encargado puede:
  1. **Revocar una Terminal Comprometida:** Bloquear el dispositivo de un guardia extraviado o robado sin afectar al resto del personal.
  2. **Revocar un Evento Completo:** En caso de clausura o fuerza mayor, invalidar todos los pases de la noche.
  3. **Incrementar Versión de Revocación:** Invalida en bloque todos los pases emitidos antes de una hora `T`.

---

## 7. Tooling y Rotación de Claves Ed25519

Las firmas Ed25519 se basan en pares de claves asimétricas generadas con el tooling oficial del repositorio.

### 7.1 Generar Par Inicial
Para generar un par nuevo listo para variables de entorno de Render:
```bash
npm run door:keys
```
Salida generada:
* `DOOR_KEY_ID`: Identificador con convención trimestral (`nightflow-key-2026-q4`).
* `DOOR_ACTIVE_KEY_ID`: Alias de la clave activa.
* `DOOR_SIGNING_KEYS`: Array JSON serializado para la variable de Render.

### 7.2 Rotación Trimestral sin Downtime (Zero-Downtime)
Al rotar una clave, los clientes con pases emitidos en los últimos 45 segundos no deben ser rechazados. Para generar la nueva clave conservando la anterior en solapamiento:
```bash
npm run door:keys -- --rotate
```
1. Genera un nuevo `DOOR_KEY_ID` (ej: `nightflow-key-2027-q1`).
2. Configura el nuevo `DOOR_SIGNING_KEYS` con la clave nueva marcada como `active: true` y la anterior como `active: false`.
3. Pega los nuevos valores en el panel de **Render > Environment Variables**.
4. Render desplegará el nuevo servicio; durante la transición, el backend firmará con la nueva clave pero verificará ambas claves válidas.

---

## 8. Resolución de Problemas (Troubleshooting)

| Síntoma | Causa Probable | Solución Operativa |
|---|---|---|
| **Cámara en negro en Safari iOS** | Permiso revocado o Safari en segundo plano | Pulsar *«Reintentar cámara»*. Si persiste, ir a *Ajustes de iOS > Safari > Cámara > Permitir*. |
| **Badge amarillo «COLA OFFLINE»** | Caída momentánea del WiFi o señal móvil | El guardia puede **seguir escaneando**. Los ingresos se almacenan en IndexedDB y se subirán solos al volver la red. |
| **Alerta «DISPOSITIVO NO ENROLADO»** | Caché del navegador limpiada | Salir y volver a entrar al módulo de puerta en `/admin`. El sistema re-enrolará la terminal en 1 segundo. |
| **Segundo escaneo da CONFLICT** | El titular ya ingresó previamente | Explicar al cliente que su pase ya fue utilizado. No cobrar de nuevo; revisar en la lista de check-in la hora de ingreso. |
| **Alerta roja «TOKEN_REVOKED»** | Terminal bloqueada por pánico o evento cancelado | Verificar con el administrador del club si la terminal fue dada de baja o si el evento sufrió cambios. |

---

## 9. Checklist de Verificación: Piloto Escenario 02:00 AM (WS-5)

Antes de abrir puertas en el primer evento en vivo, realizar este simulacro con **2 teléfonos móviles**:
* **Móvil A:** Móvil del portero con la PWA instalada en `/admin` (módulo Door).
* **Móvil B:** Móvil del cliente con su reserva y pase VIP visible.

- [ ] **Paso 1 — Conectividad e Identidad:**
  - Móvil A abre el módulo de puerta. Verificar badge verde: **«TERMINAL ENROLADA (dev-gate-...)»**.
  - Verificar que el backend responda en verde: **«EN LÍNEA (Cloud Run / Render)»**.
- [ ] **Paso 2 — Check-In Legítimo:**
  - Móvil A escanea el QR rotativo del Móvil B.
  - Verificar que en < 1 segundo la pantalla muestre **«ACCESO CONCEDIDO (INSIDE)»**.
  - Comprobar que el contador de aforo del club aumenta en 1.
- [ ] **Paso 3 — Prueba Anti-Pantallazo (Escenario #1):**
  - Tomar una captura de pantalla del QR en Móvil B y enviarla por WhatsApp a un tercer teléfono (Móvil C).
  - Esperar 45 segundos a que la ventana de expiración venza.
  - Móvil A intenta escanear la foto en Móvil C.
  - **Resultado Esperado:** Pantalla roja: **«RECHAZADO: Pase expirado / Firma no válida»**.
- [ ] **Paso 4 — Prueba Titular Dentro (Escenario #1b):**
  - Con el pase aún en estado `INSIDE`, intentar escanear el pase en Móvil B nuevamente.
  - **Resultado Esperado:** Pantalla roja: **«RECHAZADO: El titular ya está dentro del establecimiento»**.
- [ ] **Paso 5 — Salida Temporal y Reingreso Legítimo (Escenario #3):**
  - Cambiar escáner a modo *«Salida Temporal»*. Escanear Móvil B.
  - Móvil B pasa a estado `OUTSIDE_TEMPORARY` con 30 minutos de gracia.
  - Cambiar escáner a modo *«Reingreso»*. Escanear Móvil B.
  - Móvil B autoriza con FaceID / Passkey.
  - **Resultado Esperado:** Pantalla verde: **«REINGRESO CONCEDIDO (INSIDE)»**.
- [ ] **Paso 6 — Reingreso Ilegítimo sin Passkey (Escenario #2):**
  - Marcar salida temporal de nuevo en Móvil B.
  - Intentar reingresar escaneando una foto del pase en Móvil C (dispositivo sin passkey).
  - **Resultado Esperado:** Pantalla roja: **«RECHAZADO: Firma de hardware requerida»**.
- [ ] **Paso 7 — Prueba Offline e Idempotencia (Escenario #6):**
  - Activar **Modo Avión** en Móvil A.
  - Escanear un nuevo pase. Verificar que la pantalla indique: **«INGRESADO (EN COLA LOCAL)»**.
  - Desactivar Modo Avión en Móvil A.
  - Verificar que la cola se vacíe automáticamente y el servidor confirme: **«Sincronizado sin duplicidad de aforo»**.
- [ ] **Paso 8 — Botón de Pánico (Escenario #9):**
  - En Móvil A, tocar el botón SOS 2 veces.
  - Verificar que la terminal quede bloqueada y ningún pase pueda escanearse hasta que el administrador la rehabilite.

Una vez completado el checklist satisfactoriamente, el club beta queda **certificado y listo para operar en vivo**.
