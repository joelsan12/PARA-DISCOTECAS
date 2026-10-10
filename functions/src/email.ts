import { resendConfig } from "./config.js";
import { asRecord } from "./validation.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string | undefined;
  provider?: string | undefined;
  error?: string | undefined;
}

async function postJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }
    if (!text) return {};
    try {
      return asRecord(JSON.parse(text), "email provider response");
    } catch {
      return {};
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Envia correos transaccionales con reintentos limpios y fail-safe.
 * Soporta Resend (nativo en config) y SendGrid como alternativa vía env.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
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
          ...(options.text ? { text: options.text } : {})
        })
      });
      const id = typeof result.id === "string" ? result.id : undefined;
      return { sent: true, messageId: id, provider: "resend" };
    } catch (error) {
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
    } catch (error) {
      console.error("❌ [Email] Error al enviar correo vía SendGrid:", error instanceof Error ? error.message : error);
      return { sent: false, provider: "sendgrid", error: error instanceof Error ? error.message : "Error desconocido" };
    }
  }

  console.warn("⚠️ [Email] Ningún proveedor de correo configurado (configura RESEND_API_KEY y RESEND_FROM_EMAIL en Render).");
  return { sent: false, error: "NO_PROVIDER_CONFIGURED" };
}

export interface WelcomeCredentialsOptions {
  to: string;
  ownerName: string;
  clubName: string;
  city: string;
  tempPassword: string;
  adminUrl: string;
  brandUrl: string;
}

export async function sendWelcomeCredentialsEmail(options: WelcomeCredentialsOptions): Promise<SendEmailResult> {
  const { to, ownerName, clubName, city, tempPassword, adminUrl, brandUrl } = options;

  const subject = `🍸 ¡Acceso Activado! Credenciales VIP para ${clubName} — Nightflow`;

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
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 0.06em;">
                  Tu activación incluye:
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9ca3af; line-height: 1.7;">
                  <li><strong>Plano de Sala:</strong> Edición de mesas VIP, zonas y consumos mínimos.</li>
                  <li><strong>Scanner de Puerta Criptográfico:</strong> Control de aforo con QR rotativo y prevención de reenvío.</li>
                  <li><strong>Catálogo y Reservas Online:</strong> Tu página pública activa en <a href="${brandUrl}" style="color: #e5b54f; text-decoration: none;">${brandUrl}</a>.</li>
                </ul>
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
• Rol: OWNER (Propietario)

Página pública de tu club: ${brandUrl}
Soporte WhatsApp: +593 979 116 551
  `.trim();

  return await sendEmail({ to, subject, html, text });
}
