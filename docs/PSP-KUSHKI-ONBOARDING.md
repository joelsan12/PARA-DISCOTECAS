# Guía Oficial de Alta y Configuración de Comercio Kushki (NIGHTFLOW VIP)

Esta guía detalla el procedimiento para habilitar la pasarela de pagos en línea **Kushki** en modo **CLIENT_GATEWAY** (los fondos van directamente a la cuenta bancaria del establecimiento sin intermediación financiera de NIGHTFLOW).

---

## 1. Registro y Credenciales en Kushki (Sandbox / UAT)

1. Ingresa a la consola de pruebas de Kushki: **https://uat-console.kushkipagos.com**.
2. Completa el registro de tu comercio con los datos de tu empresa / RUC en Ecuador.
3. Una vez dentro de la consola, dirígete a **Integración** o **Credenciales**:
   * **Merchant ID (ID de Comercio):** Un identificador alfanumérico único (ej. `1000000123456789`).
   * **Public Key (Llave Pública):** Inicia con prefijo `pk_test_...`. Esta llave se utiliza en el frontend para inicializar el Hosted WebCheckout seguro de Kushki.
   * **Private Key / Secret Key (Llave Privada):** Llave confidencial utilizada por el backend para autorizar cobros y consultar transacciones.

---

## 2. Configuración de Webhook en Kushki

Para que las reservas se confirmen automáticamente al segundo exacto de pagarse (`HELD` → `CONFIRMED`):

1. En la consola de Kushki, navega a **Configuración** → **Webhooks**.
2. Haz clic en **Agregar Webhook** o **Nuevo Endpoint**.
3. Configura los siguientes campos:
   * **URL de Webhook:**
     ```
     https://nightflow-backend-x1an.onrender.com/v1/payments/webhooks/kushki/{TU_MERCHANT_ID}
     ```
     *(Reemplaza `{TU_MERCHANT_ID}` por tu Merchant ID exacto obtenido en el paso 1).*
   * **Eventos a suscribir:**
     * `transaction.approved` o `transaccion_aprobada`
     * `transaction.declined` o `transaccion_rechazada`
     * `transaction.refund` o `reembolso`
     * `transaction.chargeback` o `contracargo`
4. Copia el **Webhook Secret / Firma Secreta (HMAC Secret)** que genera Kushki para este endpoint.

> [!IMPORTANT]
> **Firma Nativa de Kushki:**
> Kushki firma las notificaciones HTTP enviando la cabecera `X-Kushki-Signature` con un hash SHA-256 en formato hexadecimal (64 caracteres) y un timestamp numérico en `X-Kushki-Id`. El backend de NIGHTFLOW verifica esta firma criptográficamente contra los bytes exactos recibidos de forma fail-closed (`HTTP 401` ante cualquier discrepancia).

---

## 3. Configuración de Secretos en el Servidor (Render)

Por razones estrictas de seguridad (AGENTS §13 y §14), las llaves privadas **jamás se guardan en texto plano en la base de datos**.

1. Ingresa a tu panel de control de Render (servicio `nightflow-backend`).
2. En la pestaña **Environment**, define la siguiente variable de entorno:
   * **Nombre:** `KUSHKI_WEBHOOK_SECRET_JSON`
   * **Valor:** Un objeto JSON compacto con tu llave privada y tu webhook secret:
     ```json
     {"privateApiKey":"tu_private_api_key_aqui","webhookSecret":"tu_webhook_secret_aqui"}
     ```
3. Verifica que las siguientes variables de la modalidad híbrida Spark (§14.2) sigan activas:
   ```bash
   APP_CHECK_ENFORCED=false
   APP_CHECK_REQUIRED=false
   ```
4. Guarda los cambios. Render reiniciará el servicio en ~30 segundos.

---

## 4. Activación en la Consola del Club (`PaymentGatewayManager`)

1. Inicia sesión en el portal administrativo de tu club en NIGHTFLOW (**https://nightflow-admin.web.app** o local).
2. En el menú lateral, haz clic en **Pasarela de Pagos**.
3. Completa el formulario de configuración:
   * **Modalidad:** `CLIENT_GATEWAY` (Pasarela propia del establecimiento).
   * **Proveedor:** `Kushki (Ecuador)`.
   * **Entorno:** `sandbox` (para pruebas UAT) o `production`.
   * **Merchant ID:** Tu Merchant ID de Kushki.
   * **Public Key:** Tu Public Key (`pk_test_...`).
   * **Referencia del Secreto:** Escribe exactamente:
     ```
     env://KUSHKI_WEBHOOK_SECRET_JSON
     ```
4. Haz clic en **Guardar Configuración**.
5. El sistema validará la estructura, registrará el evento de auditoría y mostrará el estado **ACTIVO**.

---

## 5. Tarjetas de Prueba UAT (Sandbox)

Para verificar el ciclo de reservas en el entorno sandbox, utiliza las siguientes tarjetas de prueba de Kushki:

| Marca | Número de Tarjeta | CVV | Expiración | Resultado Esperado |
|---|---|---|---|---|
| **Visa** | `4242 4242 4242 4242` | `123` | Fecha futura (ej. `12/28`) | Aprobada (`PAID` → `CONFIRMED`) |
| **MasterCard** | `5555 5555 5555 4444` | `456` | Fecha futura (ej. `12/28`) | Aprobada (`PAID` → `CONFIRMED`) |
| **Visa Declinada** | `4000 0000 0000 0002` | `123` | Fecha futura | Declinada (`FAILED` → `EXPIRED`) |

---

## 6. Paso a Producción (Live)

Cuando hayas concluido las pruebas de compra y reembolso:
1. Solicita la activación de tu cuenta de producción en **https://console.kushkipagos.com**.
2. En Render, actualiza `KUSHKI_WEBHOOK_SECRET_JSON` con las credenciales de producción (`pk_prod_...`, llave privada real y nuevo webhook secret).
3. En la consola del club (**Pasarela de Pagos**), cambia el entorno de `sandbox` a `production` y actualiza tu Public Key y Merchant ID de producción.
