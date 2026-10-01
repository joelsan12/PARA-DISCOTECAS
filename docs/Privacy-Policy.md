# BORRADOR — SUJETO A REVISIÓN JURÍDICA
# NO CONSTITUYE ASESORÍA LEGAL

# POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES
## CONFORME A LA LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES (LOPDP) DE ECUADOR

La presente Política de Privacidad describe el tratamiento de datos personales efectuado con ocasión de las reservas, emisión de pases VIP y control de asistencia en establecimientos que utilizan la tecnología **NIGHTFLOW VIP**.

---

### 1. IDENTIFICACIÓN DE LOS ACTORES DEL TRATAMIENTO
1.1. **El Club o Establecimiento (Responsable del Tratamiento):** Es el negocio específico donde el usuario efectúa su reserva o solicita acceso. El Club determina qué datos recopila y la finalidad de su relación comercial.
1.2. **NIGHTFLOW VIP (Encargado del Tratamiento):** Proveedor de la plataforma SaaS y soporte de infraestructura en la nube. Trata los datos exclusivamente por cuenta y mandato del Club para gestionar el inventario de mesas, pases y validaciones de seguridad.

---

### 2. DATOS PERSONALES TRATADOS
Para la correcta prestación de los servicios se procesan las siguientes categorías de datos:
- **Identificación y Contacto:** Nombre completo, correo electrónico, número de teléfono móvil (para confirmación de reserva y códigos de acceso OTP).
- **Detalles Operativos:** Mesa seleccionada, fecha y hora del evento, número de invitados, importe abonado y estado de la reserva.
- **Datos Técnicos de Seguridad:** Clave pública del dispositivo para autenticación WebAuthn/Passkey (sin datos biométricos brutos, los cuales jamás abandonan el enclave seguro del teléfono), registros de auditoría de ingreso y hora de salida.
- **Datos Financieros:** Identificador de la transacción devuelto por la pasarela de pagos. **NIGHTFLOW jamás solicita, captura ni almacena números de tarjeta de crédito (PAN) ni códigos de seguridad (CVV).**

---

### 3. BASE LEGAL Y FINALIDADES DEL TRATAMIENTO
El tratamiento de datos se fundamenta en:
- **Ejecución de Medidas Contractuales:** Permitir la reserva, emisión del pase digital y control de acceso al evento.
- **Cumplimiento de Obligaciones Legales y Tributarias:** Conservación de registros contables y comprobantes de pago conforme a la normativa del SRI.
- **Interés Legítimo de Seguridad:** Prevención del fraude, duplicación de pases y control de aforo en locales de concurrencia pública.

---

### 4. DERECHOS DE LOS TITULARES (LOPDP)
El titular de los datos puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación, Oposición y Portabilidad (Art. 15 y siguientes de la LOPDP), dirigiéndose al correo de soporte oficial del Club o a través de los canales provistos en la plataforma.

**Anonimización y Supresión Fiscal:** En caso de solicitarse la supresión de la cuenta o datos personales, el sistema destruye el perfil comercial del usuario de manera irreversible. Sin embargo, los registros de transacciones financieras y facturas se preservan bajo seudonimización estricta (`subjectPseudonym`), disociando permanentemente el nombre, teléfono y correo del registro contable exigido por el SRI.
