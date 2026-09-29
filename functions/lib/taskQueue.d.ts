export interface ReleaseTaskPayload {
    holdId: string;
    businessId: string;
    expiresAt: string;
}
export declare function enqueueReleaseTask(payload: ReleaseTaskPayload): Promise<boolean>;
