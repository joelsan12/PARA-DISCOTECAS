import { CloudTasksClient } from "@google-cloud/tasks";
import { logger } from "firebase-functions";
import { runtimeConfig } from "./config.js";
import { AppError } from "./errors.js";

export interface ReleaseTaskPayload {
  holdId: string;
  businessId: string;
  expiresAt: string;
}

export async function enqueueReleaseTask(payload: ReleaseTaskPayload): Promise<boolean> {
  const queue = runtimeConfig.cloudTasksQueue;
  if (!queue) return false;
  const projectId = runtimeConfig.projectId;
  const targetUrl = runtimeConfig.cloudTasksTargetUrl ?? (projectId
    ? `https://${runtimeConfig.region}-${projectId}.cloudfunctions.net/releaseHoldTask`
    : undefined);
  if (!targetUrl || !projectId || !runtimeConfig.cloudTasksServiceAccountEmail) {
    throw new AppError("failed-precondition", "Cloud Tasks requires project, target URL and service account configuration", 503);
  }
  const client = new CloudTasksClient();
  const parent = `projects/${projectId}/locations/${runtimeConfig.cloudTasksLocation}/queues/${queue}`;
  const schedule = new Date(payload.expiresAt);
  try {
    await client.createTask({
      parent,
      task: {
        httpRequest: {
          httpMethod: "POST",
          url: targetUrl,
          headers: { "content-type": "application/json" },
          body: Buffer.from(JSON.stringify(payload), "utf8").toString("base64"),
          oidcToken: {
            serviceAccountEmail: runtimeConfig.cloudTasksServiceAccountEmail,
            audience: targetUrl
          }
        },
        scheduleTime: {
          seconds: Math.floor(schedule.getTime() / 1000),
          nanos: 0
        }
      }
    });
    return true;
  } catch (error) {
    logger.error("Cloud Tasks release enqueue failed", error);
    throw new AppError("unavailable", "Hold release scheduling is temporarily unavailable", 503);
  } finally {
    await client.close();
  }
}
