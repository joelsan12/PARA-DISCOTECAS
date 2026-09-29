export interface ReleaseHoldTaskData {
    holdId: string;
    businessId: string;
    expiresAt: string;
}
export declare const releaseHoldTask: import("firebase-functions/v2/tasks").TaskQueueFunction<ReleaseHoldTaskData>;
