import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { logger } from "firebase-functions";
import { releaseHoldById } from "./reservations.js";
import { enqueueReleaseTask } from "./taskQueue.js";
const RETRY_DELAY_MS = 15_000;
export const releaseHoldTask = onTaskDispatched({
    retryConfig: {
        maxAttempts: 5,
        minBackoffSeconds: 10,
        maxBackoffSeconds: 300
    },
    rateLimits: { maxConcurrentDispatches: 20 },
    timeoutSeconds: 60
}, async (request) => {
    const data = request.data;
    if (!data || typeof data.holdId !== "string" || typeof data.businessId !== "string" || typeof data.expiresAt !== "string") {
        throw new Error("Invalid release task payload");
    }
    const result = await releaseHoldById(data.holdId, undefined, true);
    if (!result.released && result.reason === "NOT_EXPIRED") {
        const expiryMs = Date.parse(data.expiresAt);
        const delayMs = Number.isFinite(expiryMs)
            ? Math.max(RETRY_DELAY_MS, expiryMs - Date.now() + 1_000)
            : RETRY_DELAY_MS;
        try {
            await enqueueReleaseTask({
                holdId: data.holdId,
                businessId: data.businessId,
                expiresAt: new Date(Date.now() + delayMs).toISOString()
            });
            logger.info("releaseHoldTask rescheduled", { holdId: data.holdId, delayMs });
        }
        catch (error) {
            logger.error("releaseHoldTask reschedule failed", error, { holdId: data.holdId });
        }
        return;
    }
    logger.info("releaseHoldTask completed", { holdId: data.holdId, released: result.released, state: result.state });
});
//# sourceMappingURL=tasks.js.map