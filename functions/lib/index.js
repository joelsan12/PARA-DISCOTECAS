import { onCall, onRequest } from "firebase-functions/v2/https";
import { runtimeConfig } from "./config.js";
import { toHttpsError, AppError } from "./errors.js";
import { assertCallableAppCheck, assertHttpAppCheck } from "./security.js";
import { getClientIp, getHeader, parseJsonBody, rawBody, requirePost, sendHttpError, sendJson, setCommonHeaders } from "./http.js";
import { requestOtpFor, verifyOtpFor } from "./otp.js";
import { createBusinessCustomerProfileFor } from "./profile.js";
import { createReservationHoldFor, releaseHoldFor } from "./reservations.js";
import { processPaymentWebhook } from "./payments.js";
import { createPaymentSessionFor } from "./paymentSession.js";
import { createBusinessSessionFor } from "./sessions.js";
import { emergencyRevokeFor } from "./emergency.js";
import { privacyDeletionRequestFor } from "./privacy.js";
import { releaseHoldTask } from "./tasks.js";
import { createBusinessTenant as createBusinessTenantLogic } from "./tenant.js";
export { releaseHoldTask };
function callableError(error) {
    throw toHttpsError(error);
}
export const createBusinessTenant = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        if (!request.auth?.uid) {
            throw new AppError("unauthenticated", "Se requiere autenticación de superadministrador", 401);
        }
        return await createBusinessTenantLogic({
            ...request.data,
            uid: request.auth.uid
        });
    }
    catch (error) {
        return callableError(error);
    }
});
export const requestOtp = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await requestOtpFor(request.data, getClientIp(request.rawRequest));
    }
    catch (error) {
        return callableError(error);
    }
});
export const verifyOtp = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await verifyOtpFor(request.data, getClientIp(request.rawRequest));
    }
    catch (error) {
        return callableError(error);
    }
});
export const createBusinessCustomerProfile = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await createBusinessCustomerProfileFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const createReservationHold = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await createReservationHoldFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const releaseHold = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await releaseHoldFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const createPaymentSession = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await createPaymentSessionFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const createBusinessSession = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await createBusinessSessionFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const emergencyRevoke = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await emergencyRevokeFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
export const privacyDeletionRequest = onCall({
    enforceAppCheck: runtimeConfig.appCheckEnforced,
    consumeAppCheckToken: runtimeConfig.appCheckEnforced,
    region: runtimeConfig.region
}, async (request) => {
    try {
        assertCallableAppCheck(request);
        return await privacyDeletionRequestFor(request);
    }
    catch (error) {
        return callableError(error);
    }
});
async function handleOtpRequestHttp(request, response) {
    try {
        requirePost(request);
        await assertHttpAppCheck(request, runtimeConfig.appCheckRequiredForHttp);
        const result = await requestOtpFor(parseJsonBody(request), getClientIp(request));
        sendJson(response, 200, result);
    }
    catch (error) {
        sendHttpError(response, error);
    }
}
async function handleOtpVerifyHttp(request, response) {
    try {
        requirePost(request);
        await assertHttpAppCheck(request, runtimeConfig.appCheckRequiredForHttp);
        const result = await verifyOtpFor(parseJsonBody(request), getClientIp(request));
        sendJson(response, 200, result);
    }
    catch (error) {
        sendHttpError(response, error);
    }
}
export const requestOtpHttp = onRequest({
    cors: true,
    invoker: "public",
    region: runtimeConfig.region
}, handleOtpRequestHttp);
export const verifyOtpHttp = onRequest({
    cors: true,
    invoker: "public",
    region: runtimeConfig.region
}, handleOtpVerifyHttp);
export const paymentWebhook = onRequest({
    invoker: "public",
    region: runtimeConfig.region
}, async (request, response) => {
    try {
        requirePost(request);
        const signature = getHeader(request, "x-payment-signature") ?? getHeader(request, "x-webhook-signature") ?? getHeader(request, "x-signature");
        const result = await processPaymentWebhook(rawBody(request), signature);
        setCommonHeaders(response);
        response.status(200).json(result);
    }
    catch (error) {
        sendHttpError(response, error);
    }
});
//# sourceMappingURL=index.js.map