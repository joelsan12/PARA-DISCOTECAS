# NIGHTFLOW VIP — Guía de Alta & Configuración PayPhone Business (Cobros SaaS Flujo B)

Esta guía documenta el procedimiento paso a paso para que el equipo directivo de **NIGHTFLOW VIP** configure y opere los cobros de membresías y suscripciones SaaS de los establecimientos nocturnos (Flujo B: Dueños de discotecas hacia NIGHTFLOW).

---

## 1. Arquitectura de Dos Flujos de Dinero

En NIGHTFLOW VIP existen **dos flujos monetarios estrictamente separados**:

| Flujo | Origen | Destino | Pasarela | Propósito |
|---|---|---|---|---|
| **Flujo A** | Clientes del club | Cuenta bancaria del club | **Kushki del dueño** | Anticipos de mesas VIP, entradas y consumo. NIGHTFLOW **jamás** intermedia estos fondos. |
| **Flujo B** | Dueño de la discoteca | NIGHTFLOW VIP S.A.S. | **PayPhone Business / Transferencia** | Suscripción mensual o anual del software (`starter`, `club_pro`, `black_vip`). |

---

## 2. Registro de la Cuenta PayPhone de NIGHTFLOW

1. Ingresar al portal de comercios de PayPhone Ecuador:
   - **Sandbox / Pruebas:** [https://developer.payphone.com.ec](https://developer.payphone.com.ec) o consola de desarrolladores.
   - **Producción:** [https://live.payphone.com.ec](https://live.payphone.com.ec).
2. Iniciar sesión con la cuenta jurídica o comercial de **NIGHTFLOW VIP** (RUC ecuatoriano).
3. Ir al menú **Desarrollador / Aplicaciones**:
   - Crear una aplicación de tipo **API / Cobros Web**:
     - Nombre de la aplicación: `NIGHTFLOW VIP SaaS Subscriptions`
     - URL de respuesta: `https://nightflow-vip.web.app/club/planes`
   - Obtener las credenciales:
     - **Token de Acceso (Bearer Token):** Cadena secreta generada por PayPhone.
     - **Store ID / Código de Sucursal:** Identificador de la tienda asociada.

---

## 3. Habilitación de Tokenización de Tarjetas (cardToken)

> [!IMPORTANT]
> **Requisito Obligatorio de PayPhone:** Por políticas de seguridad PCI-DSS, PayPhone no activa la tokenización de tarjetas de forma predeterminada en cuentas nuevas. Debe solicitarse formalmente a soporte de PayPhone.

1. Enviar una solicitud al gestor de cuenta o al correo de soporte de PayPhone (`soporte@payphone.com.ec` / Mesa de ayuda PayPhone Business):
   - **Asunto:** Solicitud de habilitación de Card Tokenization para cobros recurrentes de SaaS.
   - **Cuerpo:**
     ```text
     Estimado equipo de PayPhone Ecuador,
     
     Solicitamos la habilitación del servicio de Tokenización de Tarjetas (cardToken)
     para nuestra aplicación "NIGHTFLOW VIP SaaS Subscriptions" (RUC: 1793198421001).
     
     Nuestra plataforma ofrece un sistema de gestión operativa para centros de entretenimiento
     nocturno y requiere tokenizar tarjetas de los propietarios de los locales para la
     renovación recurrente mensual y anual de sus planes de suscripción tecnológica.
     
     Agradecemos confirmar la activación en el ambiente de pruebas (sandbox) y producción.
     ```
2. Una vez habilitado, el webhook y la API devolverán el campo `cardToken` en cada transacción confirmada, permitiendo al backend de NIGHTFLOW ejecutar cargos automáticos sin requerir intervención manual del dueño en cada periodo.

---

## 4. Configuración del Webhook de Notificaciones de PayPhone

En la consola de PayPhone, en la sección **Webhooks / Notificaciones**:
1. Registrar la URL de callback del servidor en Render:
   ```text
   https://nightflow-backend-x1an.onrender.com/v1/saas/webhooks/payphone
   ```
2. **Mecanismo de Verificación:**
   A diferencia de Kushki (que utiliza HMAC-SHA256 con secret compartido), PayPhone envía un identificador de transacción (`id`, `clientTransactionId`). El backend de NIGHTFLOW implementa una **verificación activa fail-closed**: consulta inmediatamente el endpoint oficial de PayPhone `GET /api/Sale/{id}` con el Bearer Token corporativo para validar autenticidad y monto antes de acreditar el periodo.

---

## 5. Variables de Entorno en Render

En el dashboard de **Render** (`https://dashboard.render.com`), dentro del servicio `nightflow-backend`, configurar las siguientes variables de entorno:

| Variable | Valor de Ejemplo | Descripción |
|---|---|---|
| `PAYPHONE_SAAS_TOKEN` | `Bearer eyJhbGciOi...` | Token secreto de la aplicación PayPhone de NIGHTFLOW. |
| `PAYPHONE_SAAS_STORE_ID` | `SUC-001` | Identificador de sucursal/tienda en PayPhone. |
| `PAYPHONE_ENV` | `sandbox` (o `production`) | Entorno de conexión para la API de PayPhone. |

---

## 6. Alternativa de Transferencia Bancaria Manual

Para establecimientos que prefieren pagar mediante transferencia o depósito bancario local:
1. El dueño del club selecciona **Transferencia** en la consola del club (`ClubPlanAndProposalsView`).
2. El sistema muestra los datos de la cuenta corriente de NIGHTFLOW:
   - **Banco:** Banco Pichincha (Ecuador)
   - **Tipo de Cuenta:** Corriente # 2100892341
   - **Titular:** NIGHTFLOW VIP S.A.S.
   - **RUC:** 1793198421001
   - **Referencia Generada:** `NF-{clubId}-{plan}`
3. El superadministrador verifica el depósito en la cuenta bancaria.
4. En el panel SuperAdmin (`SuperAdminDashboard` → pestaña **Suscripciones & Cobros SaaS**), el superadministrador hace clic en **Registrar Transferencia**:
   - Ingresa monto, referencia bancaria y ciclo.
   - Al guardar, el backend extiende atómicamente el periodo de validez del club (`currentPeriodEnd`), registra el asiento contable en `platformSubscriptions` y audita el movimiento.

---

## 7. Políticas de Trial y Degradación Suave

1. **Trial Gratuito de 30 Días:**
   - Cualquier discoteca nueva que seleccione un plan comercial (`starter`, `club_pro`, `black_vip`) recibe automáticamente **30 días de prueba gratuita** sin cargo.
2. **Clubes Fundadores (Beta VIP):**
   - Los clubes que participaron en la fase beta (`beta_vip`) cuentan con **bypass permanente**. Su servicio no expira y no se les cobra hasta que la dirección decida formalizar un acuerdo comercial.
3. **Periodo de Gracia (Past Due):**
   - Al vencer la fecha de corte (`currentPeriodEnd`), el club entra en estado `past_due` durante **3 días**.
   - Durante los 3 días de gracia, el sistema sigue funcionando normalmente y muestra una alerta amarilla al administrador para renovar su plan.
4. **Degradación Suave (Expired):**
   - Transcurridos los 3 días de gracia sin registrar pago, el ticker del backend degrada el club al plan **Lounge Free**.
   - **Cero pérdida de datos:** Ninguna reserva, cliente, mesa ni historial es eliminado; únicamente se bloquean las características avanzadas hasta que el club renueve su plan.
