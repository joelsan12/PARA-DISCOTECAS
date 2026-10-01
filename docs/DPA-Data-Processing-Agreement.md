# BORRADOR — SUJETO A REVISIÓN JURÍDICA
# NO CONSTITUYE ASESORÍA LEGAL

# ACUERDO DE TRATAMIENTO DE DATOS PERSONALES (DPA)
## CONFORME A LA LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES DE ECUADOR (LOPDP)

El presente Acuerdo de Tratamiento de Datos Personales (el "DPA") complementa el Contrato Marco SaaS suscrito entre el **ESTABLECIMIENTO SUSCRIPTOR** (el "RESPONSABLE DEL TRATAMIENTO" o el "CLUB") y **NIGHTFLOW VIP** (el "ENCARGADO DEL TRATAMIENTO" o "NIGHTFLOW").

---

### CLÁUSULA 1: ROLES Y FINALIDADES DEL TRATAMIENTO
1.1. **Datos de Clientes y Asistentes al Establecimiento:**
   - **El CLUB actúa como RESPONSABLE DEL TRATAMIENTO.** Es quien determina los fines, medios y bases de legitimación (consentimiento, relación contractual, interés legítimo) para recopilar los datos personales de sus clientes, invitados VIP, asistentes y titulares de reservas.
   - **NIGHTFLOW actúa como ENCARGADO DEL TRATAMIENTO.** Procesa dichos datos únicamente por instrucción documentada del CLUB, limitándose a proveer la infraestructura de reservación, emisión de códigos QR dinámicos, validación de acceso en puerta y panel administrativo.
1.2. **Finalidades Propias de Nightflow:**
   - NIGHTFLOW actúa como Responsable independiente exclusivamente respecto a:
     - Facturación y cobro de los planes SaaS al CLUB.
     - Gestión y autenticación de cuentas administrativas y credenciales del personal de plataforma.
     - Auditoría técnica, seguridad perimetral, prevención de ataques informáticos y telemetría de rendimiento de la infraestructura.

---

### CLÁUSULA 2: OBLIGACIONES DEL ENCARGADO (NIGHTFLOW)
NIGHTFLOW se compromete a:
2.1. Tratar los datos personales únicamente conforme a las instrucciones legítimas impartidas por el CLUB.
2.2. Garantizar que el personal autorizado para tratar datos personales haya asumido un compromiso expreso de confidencialidad.
2.3. Implementar y mantener medidas técnicas y organizativas adecuadas para garantizar un nivel de seguridad proporcional al riesgo, tales como:
   - Cifrado de datos en reposo y en tránsito (TLS 1.3, AES-256).
   - Aislamiento multi-tenant estricto a nivel de base de datos (`businesses/{businessId}/...`).
   - Criptografía asimétrica para pases de acceso y soporte de autenticación biométrica de reingreso (WebAuthn).
   - Ausencia total de almacenamiento de datos de pago sensibles (PAN/CVV).

---

### CLÁUSULA 3: SUBENCARGADOS DEL TRATAMIENTO
3.1. El CLUB autoriza a NIGHTFLOW a subcontratar proveedores de servicios en la nube ("Subencargados") indispensables para la operación del SaaS:
   - Proveedores de infraestructura y hosting en la nube (Google Cloud Platform / Firebase / Render).
   - Proveedores de autenticación y entrega de notificaciones transaccionales (Email/SMS/WhatsApp conforme a los canales activados por el CLUB).
3.2. NIGHTFLOW suscribirá con sus Subencargados acuerdos que impongan obligaciones de protección equivalentes a las del presente DPA.

---

### CLÁUSULA 4: ASISTENCIA AL RESPONSABLE Y DERECHOS DE LOS TITULARES (LOPDP ARTS. 15, 18, 19)
4.1. **Atención de Solicitudes:** NIGHTFLOW proveerá las herramientas técnicas para que el CLUB pueda responder a solicitudes de acceso, rectificación, oposición y eliminación planteadas por los titulares.
4.2. **Límites al Derecho de Eliminación y Anonimización Fiscal:** De conformidad con la legislación tributaria y los artículos 15 y 18 de la LOPDP, cuando un titular solicite la eliminación de sus datos, NIGHTFLOW ejecutará la supresión irreversible de su perfil comercial y de marketing, aplicando una **anonimización fiscal seudonimizada (`subjectPseudonym`)** sobre los registros de pago y comprobantes fiscales que el CLUB deba conservar por mandato legal o tributario.

---

### CLÁUSULA 5: NOTIFICACIÓN DE INCIDENTES DE SEGURIDAD
5.1. En caso de suscitarse una vulneración confirmada a la seguridad de los datos personales (brecha de seguridad) que afecte datos tratados por cuenta del CLUB, NIGHTFLOW notificará al CLUB sin dilación indebida tras tener conocimiento certero, facilitando la información técnica disponible para que el CLUB cumpla con sus deberes de notificación ante la Autoridad de Protección de Datos Personales (SPDP) de Ecuador.

---

### CLÁUSULA 6: TERMINACIÓN, DEVOLUCIÓN Y SUPRESIÓN DE DATOS
6.1. A la terminación de la relación contractual, a elección del CLUB, NIGHTFLOW pondrá a disposición una copia de exportación de los datos operativos del establecimiento y procederá a la supresión segura y definitiva de los datos de los servidores de producción, salvo aquellos que NIGHTFLOW deba conservar para cumplir con obligaciones legales propias o respaldos de seguridad cifrados con ciclo de rotación programado.
