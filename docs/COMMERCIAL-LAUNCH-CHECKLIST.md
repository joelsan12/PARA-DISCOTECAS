# Checklist de Lanzamiento Comercial y Certificación de Clubes
## NIGHTFLOW VIP — Protocolo Operativo End-to-End

Este documento detalla el paso a paso riguroso para dar de alta, configurar, verificar y certificar un establecimiento nocturno real en **NIGHTFLOW VIP**, conectando todos los módulos validados: suscripciones SaaS, pasarela de cobro del cliente (Kushki), control de puerta asimétrico (Ed25519) y operaciones de sala en vivo.

---

## 1. Precondiciones de Plataforma
Antes de iniciar el onboarding de un nuevo club, verificar que la infraestructura central esté operativa:

- [ ] **1.1 Backend en Línea:**
  * Endpoint de salud: `GET https://nightflow-backend.onrender.com/health` devuelve `door: true` y `ok: true`.
  * Verificación de puerta: `GET https://nightflow-backend.onrender.com/health.door` responde `200 OK`.
- [ ] **1.2 Cuenta PayPhone Business de NIGHTFLOW (SaaS):**
  * Cuenta comercial PayPhone verificada para el cobro de planes SaaS a los clubes (consultar [docs/SAAS-BILLING-PAYPHONE-ONBOARDING.md](file:///d:/PROYECTOS/PARA%20DISCOTECAS/docs/SAAS-BILLING-PAYPHONE-ONBOARDING.md)).
  * Variables configuradas en Render: `PAYPHONE_TOKEN`, `PAYPHONE_CLIENT_ID`, `PAYPHONE_SECRET`.
- [ ] **1.3 Base de Datos y Credenciales:**
  * Cloud Firestore y Firebase Auth activos en modo Spark / híbrido.
  * `serviceAccountKey.json` disponible para tooling y scripts administrativos.

---

## 2. Alta y Registro del Club
- [ ] **2.1 Registro del Establecimiento:**
  * **Opción A (Auto-registro Beta):** El dueño del club completa el formulario en `https://nightflow-vip.web.app/beta`. El sistema aprovisiona automáticamente el tenant con plan fundador `beta_vip` y las 12 características habilitadas.
  * **Opción B (Manual Superadmin):** Desde la consola de Superadmin (`/superadmin`), ejecutar `createBusinessTenant` especificando `businessId`, nombre comercial, slug, ciudad y tipo (`discoteca`, `lounge`, `rooftop`, `bar`).
- [ ] **2.2 Verificación en Directorio Público:**
  * Consultar `businessDirectory/{businessId}` en Firestore.
  * Verificar los 9 campos públicos no sensibles: `name`, `slug`, `city`, `businessType`, `logoUrl`, `coverUrl`, `status: "active"`, `verified: true`, `authMethods`.

---

## 3. Plan y Suscripción SaaS (Flujo B)
- [ ] **3.1 Asignación de Plan:**
  * Acceder con cuenta de dueño o superadmin a la consola del club (`/admin`).
  * En la pestaña **Mi Plan** o consola de Superadmin, ejecutar `selectSubscriptionPlan`:
    * Plan recomendado inicial: `trial` (30 días de prueba gratuita) o `beta_vip` (fundadores).
    * Planes comerciales disponibles: *Lounge Free* ($0), *Club Pro* ($149/mes), *Black VIP* ($299/mes), *Enterprise* ($599/mes).
- [ ] **3.2 Confirmación de Cobro:**
  * Si es pago por transferencia bancaria directa: el superadmin aprueba y extiende el periodo con `registerSubscriptionTransfer`.
  * Si es pago con tarjeta PayPhone: se genera el botón de pago y se confirma vía webhook `/v1/saas/webhooks/payphone`.
  * Verificar en la vista de Superadmin (`/superadmin` > Suscripciones) que el estado indique `ACTIVE` o `TRIAL`.

---

## 4. Plano de Sala e Inventario Operativo (Fase O)
- [ ] **4.1 Diseño del Plano:**
  * Acceder a la consola del club en `/admin` > pestaña **Diseñador** (`FLOOR_PLAN`).
  * Seleccionar o personalizar el arquetipo (*Herradura VIP*, *Anfiteatro*, etc.).
  * Posicionar mesas, configurar nombres/códigos (`VIP-1`, `M-04`), capacidad y consumos mínimos por defecto.
- [ ] **4.2 Guardado y Sincronización:**
  * Presionar **«Guardar Plano»**.
  * El sistema ejecuta automáticamente `syncFloorPlanInventory` (Admin SDK), sincronizando atómicamente el plano visual (`layout/main`) con los recursos operativos (`businesses/{businessId}/resources/{resourceId}`).
  * Si se trata de un club migrado, ejecutar una vez:
    ```bash
    npm run backfill:resources
    ```

---

## 5. Pasarela de Pagos del Negocio (Kushki — Flujo A)
Para que el club reciba reservas online con tarjeta de crédito/débito directamente en su cuenta:

- [ ] **5.1 Onboarding del Comercio:**
  * Seguir la guía detallada [docs/PSP-KUSHKI-ONBOARDING.md](file:///d:/PROYECTOS/PARA%20DISCOTECAS/docs/PSP-KUSHKI-ONBOARDING.md).
  * El dueño del club obtiene sus credenciales en Kushki (Merchant ID, Public Key, Private Key).
  * Registra el webhook en Kushki apuntando a:
    `https://nightflow-backend.onrender.com/v1/payments/webhooks/kushki/{merchantId}`
- [ ] **5.2 Configuración en la Plataforma:**
  * Provisionar la cuenta de pagos del club:
    ```bash
    npm run provision:payments
    ```
- [ ] **5.3 Smoke Test de Pasarela:**
  * Ejecutar el script de verificación contra Render:
    ```bash
    npm run smoke:payments
    ```
  * Confirmar que el webhook responda con firma HMAC-SHA256 validada y el hold pase de `HELD` a `CONFIRMED`.

---

## 6. Personal, Terminales y Control de Puerta (Fase D)
- [ ] **6.1 Provisión de Personal de Puerta:**
  * Provisionar las cuentas de staff con rol `door`:
    ```bash
    PROVISION_DOOR_UID="<uid_del_portero>" npm run provision:production
    ```
  * Verificar que el documento `businesses/{businessId}/staff/{uid}` tenga `role: "door"` y `status: "ACTIVE"`.
- [ ] **6.2 Instalación de la PWA en Móviles del Personal:**
  * En los smartphones del club (Safari iOS o Chrome Android), navegar a `https://nightflow-vip.web.app/admin`.
  * Seleccionar **«Añadir a pantalla de inicio»** (consultar playbook [docs/DOOR-OPERATIONS.md](file:///d:/PROYECTOS/PARA%20DISCOTECAS/docs/DOOR-OPERATIONS.md)).
  * Iniciar sesión con la cuenta de portero y abrir la pestaña **Check-in / Door**.
  * Verificar que el badge indique **«TERMINAL ENROLADA (dev-gate-...)»**.
- [ ] **6.3 Smoke Test de Puerta:**
  * Ejecutar el gate de validación en infraestructura real:
    ```bash
    npm run smoke:door
    ```
  * Los 8 puntos deben estar en verde: health, JWS Ed25519 (≤45s), claves públicas servibles, anti-pantallazo 401, enrolamiento ES256, sincronización idempotente, rechazo `ALREADY_INSIDE` y botón de pánico `emergencyRevoke`.

---

## 7. Certificación «Escenario 02:00 AM» (Piloto 2 Móviles)
Con el local físico y el personal presente antes de la apertura:

- [ ] **7.1 Prueba de Check-in Real:**
  * Móvil Portero escanea el QR rotativo del Móvil Cliente.
  * Pantalla verde en < 500 ms: «ACCESO CONCEDIDO». Aforo incrementa en +1.
- [ ] **7.2 Prueba Anti-Pantallazo:**
  * Captura de pantalla del QR enviada por WhatsApp a otro teléfono.
  * Esperar 45 segundos e intentar escanear la foto: **RECHAZADO**.
- [ ] **7.3 Prueba de Salida Temporal y Reingreso:**
  * Portero marca salida temporal (ventana de 30 min iniciada).
  * Cliente intenta reingresar: firma biométrica con Passkey original concedida.
  * Teléfono clonado sin Passkey original intentando reingresar: **RECHAZADO**.
- [ ] **7.4 Prueba de Resiliencia Offline:**
  * Activar Modo Avión en el móvil del portero.
  * Realizar check-in: ingreso permitido y guardado en cola local IndexedDB.
  * Desactivar Modo Avión: cola sincronizada automáticamente sin duplicar aforo.
- [ ] **7.5 Prueba de Botón de Pánico:**
  * Doble tap en botón SOS: terminal autobloqueada y revocada en el backend.

---

## 8. Certificación Final y Luz Verde
El establecimiento se considera **CERTIFICADO PARA PRODUCCIÓN** cuando se completan todos los checks anteriores y:

1. `npm run smoke:door` ejecutado con éxito (0 errores).
2. `npm run smoke:payments` ejecutado con éxito (0 errores).
3. Estado de suscripción en Firestore: `ACTIVE` o `TRIAL`.
4. Evento principal creado y publicado (`is_published: true`).
5. Plano de sala sincronizado en `resources/`.

Firma de Certificación Técnica: **NIGHTFLOW DEVOPS & SECURITY TEAM**
