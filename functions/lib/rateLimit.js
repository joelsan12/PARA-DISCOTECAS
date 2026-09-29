import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./config.js";
import { sha256 } from "./crypto.js";
import { AppError } from "./errors.js";
export async function enforceRateLimit(scope, parts, limit, windowSeconds) {
    const key = sha256(`${scope}:${parts.join(":")}`);
    const reference = db.collection("rateLimits").doc(key);
    const now = Date.now();
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        const data = snapshot.data();
        const resetAt = data?.resetAt instanceof Timestamp ? data.resetAt.toMillis() : 0;
        if (!snapshot.exists || resetAt <= now) {
            transaction.set(reference, {
                scope,
                keyHash: key,
                count: 1,
                resetAt: Timestamp.fromMillis(now + windowSeconds * 1000),
                updatedAt: FieldValue.serverTimestamp()
            });
            return;
        }
        const count = typeof data?.count === "number" ? data.count : 0;
        if (count >= limit) {
            const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
            throw new AppError("resource-exhausted", `Rate limit exceeded. Retry in ${retryAfter} seconds`, 429);
        }
        transaction.update(reference, {
            count: count + 1,
            updatedAt: FieldValue.serverTimestamp()
        });
    });
}
//# sourceMappingURL=rateLimit.js.map