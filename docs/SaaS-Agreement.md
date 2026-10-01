# BORRADOR — SUJETO A REVISIÓN JURÍDICA
# NO CONSTITUYE ASESORÍA LEGAL

# CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS DE SOFTWARE (SaaS AGREEMENT)
## NIGHTFLOW VIP — PLATAFORMA TECNOLÓGICA PARA CLUBES Y EVENTOS

Entre, por una parte, **NIGHTFLOW VIP** (en adelante, el "PROVEEDOR TECNOLÓGICO"), operador de la plataforma de software para gestión de reservas, control de acceso VIP, validación criptográfica y analítica operativa; y por otra parte, el **ESTABLECIMIENTO SUSCRIPTOR** (en adelante, el "CLIENTE" o "CLUB"), persona natural o jurídica dedicada a la operación de centros de diversión nocturna, discotecas, bares o eventos.

---

### CLÁUSULA PRIMERA: NATURALEZA DEL SERVICIO Y OBJETO
1.1. El PROVEEDOR TECNOLÓGICO otorga al CLUB una licencia limitada, no exclusiva, intransferible y revocable para acceder y utilizar la plataforma SaaS **NIGHTFLOW VIP** como herramienta técnica de gestión.
1.2. **Delimitación Operativa Esencial:** NIGHTFLOW VIP actúa exclusivamente como proveedor de infraestructura técnica y software en la nube. En consecuencia:
   - NIGHTFLOW **no es organizador, promotor, vendedor ni comisionista** de las entradas, reservas o consumos ofrecidos por el CLUB.
   - NIGHTFLOW **no realiza intermediación financiera, captación de depósitos, custodia ni dispersión de fondos** pertenecientes a terceros o consumidores finales.

---

### CLÁUSULA SEGUNDA: MODELO DE PAGOS Y RELACIÓN FINANCIERA (BCE / PSP)
2.1. Las transacciones comerciales derivadas de la venta de entradas o reservas se rigen exclusivamente bajo uno de los siguientes esquemas técnicos:
   - **PAY_AT_DOOR (Pago en Puerta / Taquilla):** El CLUB realiza el cobro de forma física o presencial directamente en sus instalaciones sin intervención de pasarelas en línea.
   - **CLIENT_GATEWAY (Pasarela Propia del Club):** El CLUB integra sus propias credenciales comerciales otorgadas por un Proveedor de Servicios de Pago (PSP) debidamente autorizado por el Banco Central del Ecuador (BCE) o la autoridad financiera competente. Los fondos de los tarjetahabientes son liquidados directa e íntegramente por el PSP a la cuenta bancaria del CLUB.
   - **ASSISTED_GATEWAY (Asistencia Técnica de Configuración):** NIGHTFLOW asiste técnicamente al CLUB en la configuración de sus credenciales y parámetros de integración, manteniendo el CLUB la titularidad de la cuenta mercantil, el contrato con el PSP y la recepción exclusiva de los fondos.
2.2. **Tarifas SaaS:** La remuneración a favor de NIGHTFLOW corresponde estrictamente al licenciamiento de software, cuota de soporte, suscripción mensual o tarifa por uso de infraestructura tecnológica, facturada directamente por NIGHTFLOW al CLUB conforme al plan contratado.

---

### CLÁUSULA TERCERA: SEGURIDAD, INTEGRIDAD Y CUMPLIMIENTO PCI-DSS
3.1. **Externalización de Pagos:** La plataforma NIGHTFLOW VIP no procesa, no captura ni almacena números de tarjeta primaria (PAN), códigos de seguridad (CVV/CVC) ni datos de banda magnética en sus interfaces ni bases de datos. Todo ingreso de credenciales de pago se delega al entorno seguro (Hosted Checkout / iFrame oficial) provisto por el PSP del CLUB.
3.2. **Determinación de Cumplimiento:** La aplicabilidad del estándar PCI-DSS (incluyendo la determinación del cuestionario SAQ aplicable, como SAQ A) corresponde a la relación contractual directa entre el CLUB y su PSP o adquirente bancario.

---

### CLÁUSULA CUARTA: RESPONSABILIDADES Y OBLIGACIONES DEL CLUB
4.1. El CLUB es el único emisor y responsable tributario frente al consumidor final por los boletos, accesos, consumos y servicios prestados, debiendo emitir la factura o comprobante fiscal correspondiente conforme a la normativa del Servicio de Rentas Internas (SRI).
4.2. El CLUB es responsable de definir, publicar y hacer cumplir sus políticas de admisión, edad mínima, código de vestimenta, horarios de atención, cancelación de eventos y devoluciones.

---

### CLÁUSULA QUINTA: TRATAMIENTO DE DATOS PERSONALES (LOPDP)
5.1. Las partes reconocen y aceptan los roles estipulados en el **Acuerdo de Tratamiento de Datos (DPA)** anexo al presente contrato, reconociendo al CLUB como **Responsable del Tratamiento** de los datos de sus clientes y a NIGHTFLOW como **Encargado del Tratamiento**, de conformidad con la Ley Orgánica de Protección de Datos Personales del Ecuador.

---

### CLÁUSULA SEXTA: LIMITACIÓN DE RESPONSABILIDAD
6.1. NIGHTFLOW no será responsable por fallas derivadas de interrupciones en los servicios de terceros (redes de telecomunicaciones, servidores del PSP, pasarelas de pago, contingencias de fuerza mayor o actos de la autoridad).
6.2. La disponibilidad del servicio se sujeta a los términos establecidos en el Acuerdo de Nivel de Servicio (SLA) vigente.
