import { Timestamp } from "firebase-admin/firestore";
import { db } from "./config.js";
import { asRecord, optionalString, requiredString } from "./validation.js";
import { sendFeedbackNotificationEmail } from "./email.js";
import { AppError } from "./errors.js";
export const ALLOWED_FEEDBACK_CATEGORIES = ["suggestion", "bug", "reservation", "design"];
export function parseFeedbackInput(value) {
    const record = asRecord(value, "feedback");
    const rawRating = Number(record.rating);
    if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
        throw new AppError("invalid-argument", "La calificación debe ser un número entero entre 1 y 5.", 400);
    }
    const category = requiredString(record, "category", 2, 20);
    if (!ALLOWED_FEEDBACK_CATEGORIES.includes(category)) {
        throw new AppError("invalid-argument", `Categoría inválida: ${category}. Permitidas: ${ALLOWED_FEEDBACK_CATEGORIES.join(", ")}`, 400);
    }
    const message = requiredString(record, "message", 1, 1000);
    const contact = optionalString(record, "contact", 0, 60) || "";
    const portal = optionalString(record, "portal", 1, 30) || "client";
    const path = optionalString(record, "path", 1, 120) || "/";
    const clientVersion = optionalString(record, "clientVersion", 1, 20) || "v0.1.0-beta.1";
    const rawContext = record.context;
    const context = (rawContext && typeof rawContext === "object" && !Array.isArray(rawContext))
        ? rawContext
        : { portal, path };
    return {
        rating: rawRating,
        category,
        message,
        contact,
        portal,
        path,
        context,
        clientVersion
    };
}
export async function submitFeedbackAndNotify(input) {
    const now = Timestamp.now();
    const docData = {
        rating: input.rating,
        category: input.category,
        message: input.message,
        contact: input.contact || "",
        context: input.context ?? { portal: input.portal, path: input.path },
        clientVersion: input.clientVersion || "v0.1.0-beta.1",
        createdAt: now
    };
    const docRef = await db.collection("betaFeedback").add(docData);
    console.info(`📝 [Feedback] Nuevo feedback registrado en Firestore: ${docRef.id} (${input.rating}★, ${input.category})`);
    // Despacho de notificación por correo electrónico
    const emailResult = await sendFeedbackNotificationEmail({
        rating: input.rating,
        category: input.category,
        message: input.message,
        contact: input.contact,
        path: input.path,
        portal: input.portal,
        clientVersion: input.clientVersion
    });
    return {
        success: true,
        id: docRef.id,
        emailSent: emailResult.sent,
        message: emailResult.sent
            ? "Feedback recibido y notificación enviada por correo."
            : "Feedback recibido y registrado en base de datos."
    };
}
//# sourceMappingURL=feedback.js.map