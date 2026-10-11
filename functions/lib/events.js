import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isSuperAdmin, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { asRecord, assertAllowedKeys, optionalId, optionalNumber, optionalString, requiredBoolean, requiredId, requiredString } from "./validation.js";
const ALLOWED_EVENT_KEYS = [
    "businessId",
    "eventId",
    "title",
    "subtitle",
    "date",
    "day_label",
    "door_time",
    "cover_price",
    "dj_guest",
    "genre",
    "flyer_url",
    "is_published",
    "experience_type",
    "floor_plan_version_id"
];
export function parseUpsertEventInput(value) {
    const record = asRecord(value, "evento");
    assertAllowedKeys(record, ALLOWED_EVENT_KEYS);
    const businessId = requiredId(record, "businessId");
    const eventId = optionalId(record, "eventId");
    const title = requiredString(record, "title", 2, 100);
    const subtitle = optionalString(record, "subtitle", 1, 150) ?? "";
    const date = requiredString(record, "date", 8, 12);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError("invalid-argument", "date must be in YYYY-MM-DD format");
    }
    const day_label = optionalString(record, "day_label", 1, 50) ?? "";
    const door_time = optionalString(record, "door_time", 1, 10) ?? "22:00";
    const cover_price = optionalNumber(record, "cover_price", 0, 10_000) ?? 0;
    const dj_guest = optionalString(record, "dj_guest", 1, 100) ?? "";
    const genre = optionalString(record, "genre", 1, 100) ?? "";
    const flyer_url = optionalString(record, "flyer_url", 1, 500) ?? "";
    const is_published = requiredBoolean(record, "is_published", false);
    const experience_type = optionalString(record, "experience_type", 1, 50);
    const floor_plan_version_id = optionalString(record, "floor_plan_version_id", 1, 100);
    return {
        businessId,
        ...(eventId ? { eventId } : {}),
        title,
        subtitle,
        date,
        day_label,
        door_time,
        cover_price,
        dj_guest,
        genre,
        flyer_url,
        is_published,
        ...(experience_type ? { experience_type } : {}),
        ...(floor_plan_version_id ? { floor_plan_version_id } : {})
    };
}
export async function upsertBusinessEventFor(request) {
    const uid = callableUid(request);
    const input = parseUpsertEventInput(request.data);
    const businessRef = db.collection("businesses").doc(input.businessId);
    const businessSnapshot = await businessRef.get();
    if (!businessSnapshot.exists) {
        throw new AppError("not-found", "Business not found", 404);
    }
    let actorRole = "super_admin";
    if (!(await isSuperAdmin(uid))) {
        const staff = await requireStaff(uid, input.businessId, "manager");
        actorRole = staff.role;
    }
    const eventsCollection = businessRef.collection("events");
    let eventRef;
    let isNew = false;
    if (input.eventId) {
        eventRef = eventsCollection.doc(input.eventId);
    }
    else {
        // Verificar tope de 50 eventos por negocio para prevenir abusos
        const currentEventsSnapshot = await eventsCollection.limit(51).get();
        if (currentEventsSnapshot.size >= 50) {
            throw new AppError("resource-exhausted", "El límite de 50 eventos para este establecimiento ha sido alcanzado", 429);
        }
        const autoId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        eventRef = eventsCollection.doc(autoId);
        isNew = true;
    }
    const eventSnapshot = await eventRef.get();
    if (!eventSnapshot.exists) {
        isNew = true;
    }
    const now = FieldValue.serverTimestamp();
    const eventData = {
        id: eventRef.id,
        club_id: input.businessId,
        title: input.title,
        subtitle: input.subtitle || "",
        date: input.date,
        day_label: input.day_label || input.date,
        door_time: input.door_time || "22:00",
        cover_price: input.cover_price ?? 0,
        dj_guest: input.dj_guest || "",
        genre: input.genre || "",
        flyer_url: input.flyer_url || "",
        is_published: input.is_published ?? false,
        updatedAt: now
    };
    if (input.experience_type)
        eventData.experience_type = input.experience_type;
    if (input.floor_plan_version_id)
        eventData.floor_plan_version_id = input.floor_plan_version_id;
    if (isNew) {
        eventData.createdAt = now;
    }
    await eventRef.set(eventData, { merge: true });
    await writeAudit(isNew ? "event_created" : "event_updated", "event", eventRef.id, {
        businessId: input.businessId,
        actorUid: uid,
        actorRole,
        requestId: getRequestId(request.rawRequest),
        ip: getClientIp(request.rawRequest)
    }, { title: input.title, date: input.date, is_published: input.is_published ?? false });
    return {
        success: true,
        eventId: eventRef.id,
        event: {
            ...eventData,
            updatedAt: Date.now()
        }
    };
}
//# sourceMappingURL=events.js.map