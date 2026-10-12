import { resendConfig } from "./config.js";
import { asRecord } from "./validation.js";
async function postJson(url, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
        }
        if (!text)
            return {};
        try {
            return asRecord(JSON.parse(text), "email provider response");
        }
        catch {
            return {};
        }
    }
    finally {
        clearTimeout(timeout);
    }
}
/**
 * Envia correos transaccionales con reintentos limpios y fail-safe.
 * Soporta Resend (nativo en config) y SendGrid como alternativa vía env.
 */
export async function sendEmail(options) {
    const resend = resendConfig();
    if (resend) {
        try {
            const result = await postJson("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    authorization: `Bearer ${resend.apiKey}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    from: resend.from,
                    to: [options.to],
                    subject: options.subject,
                    html: options.html,
                    ...(options.text ? { text: options.text } : {}),
                    ...(options.replyTo ? { reply_to: options.replyTo } : {})
                })
            });
            const id = typeof result.id === "string" ? result.id : undefined;
            return { sent: true, messageId: id, provider: "resend" };
        }
        catch (error) {
            console.error("❌ [Email] Error al enviar correo vía Resend:", error instanceof Error ? error.message : error);
            return { sent: false, provider: "resend", error: error instanceof Error ? error.message : "Error desconocido" };
        }
    }
    const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL?.trim() || "vip@nightflow.vip";
    if (sendgridKey) {
        try {
            await postJson("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                    authorization: `Bearer ${sendgridKey}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: options.to }] }],
                    from: { email: sendgridFrom, name: "Nightflow VIP" },
                    subject: options.subject,
                    content: [
                        { type: "text/html", value: options.html }
                    ]
                })
            });
            return { sent: true, provider: "sendgrid" };
        }
        catch (error) {
            console.error("❌ [Email] Error al enviar correo vía SendGrid:", error instanceof Error ? error.message : error);
            return { sent: false, provider: "sendgrid", error: error instanceof Error ? error.message : "Error desconocido" };
        }
    }
    console.warn("⚠️ [Email] Ningún proveedor de correo configurado (configura RESEND_API_KEY y RESEND_FROM_EMAIL en Render).");
    return { sent: false, error: "NO_PROVIDER_CONFIGURED" };
}
export async function sendWelcomeCredentialsEmail(options) {
    const { to, ownerName, clubName, city, tempPassword, adminUrl, brandUrl } = options;
    const subject = `Acceso y credenciales para ${clubName} — Nightflow VIP`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Activado — Nightflow VIP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090d; min-height: 100vh; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #11121a 0%, #0c0d12 100%); border: 1px solid rgba(229, 181, 79, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);" cellspacing="0" cellpadding="0">
          
          <!-- Banner Dorado Superior -->
          <tr>
            <td style="background: linear-gradient(90deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%); height: 4px;"></td>
          </tr>

          <!-- Encabezado con Marca -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(229, 181, 79, 0.12); border: 1px solid rgba(229, 181, 79, 0.3); border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #e5b54f; text-transform: uppercase; margin-bottom: 12px;">
                BETA PRIVADA VIP
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff;">
                NIGHTFLOW <span style="color: #e5b54f;">VIP</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af; letter-spacing: 0.02em;">
                Sistema Operativo de Alta Fidelidad para Discotecas & Clubes
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 10px 36px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb; margin: 0 0 16px;">
                Hola <strong>${ownerName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; margin: 0 0 24px;">
                Tu establecimiento <strong style="color: #ffffff;">${clubName}</strong> (${city}) ha sido activado con éxito en la plataforma Nightflow VIP. Hemos generado tu espacio en la nube con plano de sala, terminal de puerta y control en tiempo real.
              </p>

              <!-- Tarjeta de Credenciales -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(18, 19, 26, 0.95); border: 1px solid rgba(229, 181, 79, 0.3); border-radius: 12px; margin-bottom: 26px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; background: rgba(229, 181, 79, 0.08); border-bottom: 1px solid rgba(229, 181, 79, 0.2);">
                    <span style="font-size: 12px; font-weight: 700; color: #e5b54f; text-transform: uppercase; letter-spacing: 0.08em;">
                      🔑 Credenciales de Acceso a tu Consola
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #9ca3af;">Establecimiento:</td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-weight: 700; text-align: right;">${clubName}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #9ca3af;">Usuario / Correo:</td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-weight: 700; text-align: right; font-family: monospace;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #9ca3af;">Contraseña Temporal:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #e5b54f; font-weight: 800; text-align: right; font-family: monospace; letter-spacing: 0.05em;">${tempPassword}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #9ca3af;">Rol Asignado:</td>
                        <td style="font-size: 13px; color: #34d399; font-weight: 700; text-align: right;">OWNER (Propietario / Admin)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Primario de Ingreso -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #e5b54f 0%, #c49733 100%); color: #08090d; font-size: 14px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; padding: 15px 24px; border-radius: 10px; box-shadow: 0 8px 24px rgba(229, 181, 79, 0.35);">
                      Ingresar a mi Consola de Club
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Módulos Incluidos -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 22px;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 0.06em;">
                  Tu activación incluye:
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9ca3af; line-height: 1.7;">
                  <li><strong>Plano de Sala:</strong> Edición de mesas VIP, zonas y consumos mínimos.</li>
                  <li><strong>Scanner de Puerta Criptográfico:</strong> Control de aforo con QR rotativo y prevención de reenvío.</li>
                  <li><strong>Catálogo y Reservas Online:</strong> Tu página pública activa en <a href="${brandUrl}" style="color: #e5b54f; text-decoration: none;">${brandUrl}</a>.</li>
                </ul>
              </div>

              <!-- Bloque Destacado: Guías Visuales Oficiales en PDF -->
              <div style="background: linear-gradient(180deg, rgba(229, 181, 79, 0.08) 0%, rgba(229, 181, 79, 0.03) 100%); border: 1px solid rgba(229, 181, 79, 0.35); border-radius: 12px; padding: 20px; margin-bottom: 26px;">
                <div style="margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 800; color: #e5b54f; text-transform: uppercase; letter-spacing: 0.12em; background: rgba(229, 181, 79, 0.15); border: 1px solid rgba(229, 181, 79, 0.3); border-radius: 6px; padding: 3px 8px; display: inline-block; margin-bottom: 6px;">
                    MATERIAL OFICIAL DE OPERACIÓN
                  </span>
                  <h3 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #ffffff;">
                    📚 Guías Visuales Prácticas para tu Equipo (PDF)
                  </h3>
                  <p style="margin: 6px 0 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.5;">
                    Manuales ilustrados paso a paso (100% sencillos y sin palabras difíciles) diseñados para que tú, tus gerentes, cajeros y meseros operen la noche en minutos:
                  </p>
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 12.5px;">
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">
                        🗺️ 1. Guía: Diseñador de Plano
                      </div>
                      <div style="color: #9ca3af; font-size: 11.5px; margin-bottom: 6px;">
                        Cómo crear y organizar el mapa de tus mesas, palcos y barras en 5 minutos.
                      </div>
                      <a href="https://nightflow-vip.web.app/guias/Guia_Visual_Crear_Plano_Para_Clubes.pdf" target="_blank" style="display: inline-block; font-size: 11.5px; font-weight: 700; color: #e5b54f; text-decoration: none; border: 1px solid rgba(229, 181, 79, 0.4); padding: 4px 10px; border-radius: 6px; background: rgba(229, 181, 79, 0.1);">
                        Descargar Guía de Plano (PDF) &rarr;
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">
                        🍸 2. Guía: Sala en Vivo & Concierge
                      </div>
                      <div style="color: #9ca3af; font-size: 11.5px; margin-bottom: 6px;">
                        Control en tiempo real, semáforo de colores de mesas y despacho rápido de botellas.
                      </div>
                      <a href="https://nightflow-vip.web.app/guias/Guia_Visual_Sala_Concierge_Dueno.pdf" target="_blank" style="display: inline-block; font-size: 11.5px; font-weight: 700; color: #e5b54f; text-decoration: none; border: 1px solid rgba(229, 181, 79, 0.4); padding: 4px 10px; border-radius: 6px; background: rgba(229, 181, 79, 0.1);">
                        Descargar Guía de Sala & Concierge (PDF) &rarr;
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">
                        🎟️ 3. Guía: Cartelera de Eventos
                      </div>
                      <div style="color: #9ca3af; font-size: 11.5px; margin-bottom: 6px;">
                        Cómo publicar fiestas temáticas, fijar horarios de cover y vender entradas anticipadas.
                      </div>
                      <a href="https://nightflow-vip.web.app/guias/Guia_Visual_Eventos_Dueno.pdf" target="_blank" style="display: inline-block; font-size: 11.5px; font-weight: 700; color: #e5b54f; text-decoration: none; border: 1px solid rgba(229, 181, 79, 0.4); padding: 4px 10px; border-radius: 6px; background: rgba(229, 181, 79, 0.1);">
                        Descargar Guía de Eventos (PDF) &rarr;
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">
                        📋 4. Guía: Control de Reservas & Entrada
                      </div>
                      <div style="color: #9ca3af; font-size: 11.5px; margin-bottom: 6px;">
                        Búsqueda rápida por nombre o celular en puerta y verificación de anticipos pagados.
                      </div>
                      <a href="https://nightflow-vip.web.app/guias/Guia_Visual_Reservas_Dueno.pdf" target="_blank" style="display: inline-block; font-size: 11.5px; font-weight: 700; color: #e5b54f; text-decoration: none; border: 1px solid rgba(229, 181, 79, 0.4); padding: 4px 10px; border-radius: 6px; background: rgba(229, 181, 79, 0.1);">
                        Descargar Guía de Reservas (PDF) &rarr;
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">
                        👥 5. Guía: Personal, Meseros & Roles de Sala
                      </div>
                      <div style="color: #9ca3af; font-size: 11.5px; margin-bottom: 6px;">
                        Cómo dar accesos individuales a tu equipo y asignar zonas de mesas para evitar cruces.
                      </div>
                      <a href="https://nightflow-vip.web.app/guias/Guia_Visual_Personal_Staff_Dueno.pdf" target="_blank" style="display: inline-block; font-size: 11.5px; font-weight: 700; color: #e5b54f; text-decoration: none; border: 1px solid rgba(229, 181, 79, 0.4); padding: 4px 10px; border-radius: 6px; background: rgba(229, 181, 79, 0.1);">
                        Descargar Guía de Personal & Meseros (PDF) &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Soporte Directo WhatsApp -->
              <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 0; text-align: center;">
                ¿Deseas personalizar tu plano o requieres ayuda? Contáctanos directamente a nuestro WhatsApp VIP:
                <br>
                <a href="https://wa.me/593979116551" style="color: #34d399; font-weight: 700; text-decoration: none; display: inline-block; margin-top: 4px;">
                  💬 +593 979 116 551 (Soporte Oficial Nightflow)
                </a>
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="padding: 20px 36px; background: rgba(8, 9, 13, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                © 2026 NIGHTFLOW VIP • Sistema Operativo para Discotecas y Clubes Nocturnos.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
    const text = `
NIGHTFLOW VIP — Beta Privada
¡Acceso Activado para ${clubName}!

Hola ${ownerName}:
Tu club ${clubName} (${city}) ha sido activado con éxito.

CREDENCIALES DE ACCESO:
• Portal de Administración: ${adminUrl}
• Usuario / Correo: ${to}
• Contraseña Temporal: ${tempPassword}
• Rol: OWNER (Propietario / Acceso Total)

Página pública de tu club: ${brandUrl}

GUÍAS VISUALES PRÁCTICAS OFICIALES (Descarga directa en PDF):
1. Diseñador de Plano: https://nightflow-vip.web.app/guias/Guia_Visual_Crear_Plano_Para_Clubes.pdf
2. Sala en Vivo & Concierge: https://nightflow-vip.web.app/guias/Guia_Visual_Sala_Concierge_Dueno.pdf
3. Cartelera de Eventos: https://nightflow-vip.web.app/guias/Guia_Visual_Eventos_Dueno.pdf
4. Control de Reservas & Entrada: https://nightflow-vip.web.app/guias/Guia_Visual_Reservas_Dueno.pdf
5. Personal, Meseros & Roles: https://nightflow-vip.web.app/guias/Guia_Visual_Personal_Staff_Dueno.pdf

Soporte WhatsApp VIP: +593 979 116 551
  `.trim();
    return await sendEmail({ to, subject, html, text, replyTo: "contacto@j2sdynamics.com" });
}
const CATEGORY_NAMES_ES = {
    suggestion: "Sugerencia",
    bug: "Reporte de Error",
    reservation: "Reservas",
    design: "Diseño VIP"
};
export async function sendFeedbackNotificationEmail(options) {
    const primaryRecipient = options.to?.trim() || process.env.FEEDBACK_NOTIFICATION_EMAIL?.trim() || "contacto@j2sdynamics.com";
    const categoryLabel = CATEGORY_NAMES_ES[options.category] ?? options.category;
    const starsString = "★".repeat(Math.max(1, Math.min(5, options.rating))) + "☆".repeat(Math.max(0, 5 - options.rating));
    const subject = `🔔 [Feedback VIP] ${starsString} (${categoryLabel}) — Nightflow`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Feedback Beta — Nightflow VIP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090d; min-height: 100vh; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #11121a 0%, #0c0d12 100%); border: 1px solid rgba(229, 181, 79, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);" cellspacing="0" cellpadding="0">
          
          <!-- Banner Superior Dorado -->
          <tr>
            <td style="background: linear-gradient(90deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%); height: 4px;"></td>
          </tr>

          <!-- Encabezado -->
          <tr>
            <td style="padding: 30px 36px 16px; text-align: left;">
              <div style="display: inline-block; padding: 4px 12px; background: rgba(229, 181, 79, 0.12); border: 1px solid rgba(229, 181, 79, 0.3); border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #e5b54f; text-transform: uppercase; margin-bottom: 10px;">
                NUEVO FEEDBACK BETA RECIBIDO
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Notificación de Experiencia VIP
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af;">
                Un usuario ha enviado sus comentarios directamente desde la plataforma.
              </p>
            </td>
          </tr>

          <!-- Resumen de Valoración y Categoría -->
          <tr>
            <td style="padding: 10px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(18, 19, 26, 0.95); border: 1px solid rgba(229, 181, 79, 0.25); border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; display: block; margin-bottom: 4px;">Calificación</span>
                    <strong style="font-size: 18px; color: #e5b54f; letter-spacing: 2px;">${starsString}</strong>
                    <span style="font-size: 12px; color: #d1d5db; display: block; margin-top: 2px;">(${options.rating} de 5 estrellas)</span>
                  </td>
                  <td style="width: 50%; vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; display: block; margin-bottom: 4px;">Categoría</span>
                    <strong style="font-size: 15px; color: #ffffff;">${categoryLabel}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mensaje del Usuario -->
          <tr>
            <td style="padding: 14px 36px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; display: block; margin-bottom: 8px;">Mensaje o Sugerencia:</span>
              <div style="background: #08090e; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3px solid #e5b54f; border-radius: 8px; padding: 16px 18px; font-size: 14px; line-height: 1.6; color: #ffffff; white-space: pre-wrap;">
${options.message}
              </div>
            </td>
          </tr>

          <!-- Contacto del Usuario (si aplica) -->
          <tr>
            <td style="padding: 6px 36px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 12px 16px;">
                <tr>
                  <td>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; display: block;">Datos de Contacto:</span>
                    <strong style="font-size: 14px; color: ${options.contact ? '#e5b54f' : '#6b7280'};">
                      ${options.contact || 'No especificado (anónimo)'}
                    </strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Metadatos Técnicos -->
          <tr>
            <td style="padding: 10px 36px 26px;">
              <p style="margin: 0; font-size: 11px; color: #6b7280; line-height: 1.5;">
                • Ruta: <code>${options.path || '/'}</code> | Portal: <code>${options.portal || 'web'}</code> | Versión: <code>${options.clientVersion || 'beta'}</code>
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="padding: 18px 36px; background: rgba(8, 9, 13, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                © 2026 NIGHTFLOW VIP • Sistema de Notificaciones de Soporte Beta
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
    const text = `
NIGHTFLOW VIP — Nuevo Feedback Recibido
Calificación: ${starsString} (${options.rating}/5)
Categoría: ${categoryLabel}

Mensaje:
${options.message}

Contacto: ${options.contact || 'No especificado'}
Ruta: ${options.path || '/'}
Portal: ${options.portal || 'web'}
Versión: ${options.clientVersion || 'beta'}
  `.trim();
    // Intento 1: Enviar al destinatario primario (contacto@j2sdynamics.com)
    const result = await sendEmail({ to: primaryRecipient, subject, html, text });
    if (result.sent) {
        return result;
    }
    // Fallback seguro a la cuenta de prueba en Resend para garantizar entrega
    const fallbackEmail = "geremia23sancan@gmail.com";
    if (primaryRecipient !== fallbackEmail) {
        console.warn(`⚠️ [Feedback] Envío a ${primaryRecipient} falló (${result.error}). Intentando fallback a ${fallbackEmail}...`);
        return await sendEmail({ to: fallbackEmail, subject, html, text });
    }
    return result;
}
//# sourceMappingURL=email.js.map