/**
 * Adaptador de Pagos PayPhone Business para Suscripciones SaaS (NIGHTFLOW)
 * Flujo B (Dueño del club -> NIGHTFLOW)
 * Documentación y requisitos: docs/SAAS-BILLING-PAYPHONE-ONBOARDING.md
 */
import { AppError } from '../errors.js';
export class PayPhoneSaasClient {
    getBaseUrl(env) {
        return env === 'production'
            ? 'https://pay.payphonetodoesposible.com/api'
            : 'https://pay.payphonetodoesposible.com/api'; // PayPhone usa mismo host con credenciales de prueba/producción
    }
    /**
     * Prepara una sesión de pago (Web Checkout de PayPhone)
     */
    async preparePayment(config, input) {
        if (!config.token) {
            throw new AppError('failed-precondition', 'PAYPHONE_SAAS_TOKEN no configurado en el servidor', 503);
        }
        const amountInCents = Math.round(input.amount * 100);
        const body = {
            responseUrl: input.responseUrl,
            amount: amountInCents,
            amountWithoutTax: amountInCents,
            amountWithTax: 0,
            tax: 0,
            service: 0,
            tip: 0,
            currency: 'USD',
            reference: input.reference,
            clientTransactionId: input.clientTransactionId,
        };
        if (config.storeId) {
            body.storeId = config.storeId;
        }
        const url = `${this.getBaseUrl(config.environment)}/button/Prepare`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.token}`,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new AppError('unavailable', `Error al iniciar sesión de pago en PayPhone (${res.status}): ${errorText}`, 502);
        }
        const data = (await res.json());
        const payUrl = data.payWithCard || data.payWithPayPhone || '';
        if (!payUrl) {
            throw new AppError('unavailable', 'PayPhone no retornó URL de pago válida', 502);
        }
        return {
            paymentId: data.paymentId,
            payUrl,
            clientTransactionId: input.clientTransactionId,
        };
    }
    /**
     * Verifica activamente una transacción contra la API de PayPhone (Fail-closed).
     */
    async confirmPayment(config, paymentId, clientTxId) {
        if (!config.token) {
            throw new AppError('failed-precondition', 'PAYPHONE_SAAS_TOKEN no configurado', 503);
        }
        const url = `${this.getBaseUrl(config.environment)}/button/V2/Confirm?id=${paymentId}&clientTxId=${encodeURIComponent(clientTxId)}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${config.token}`,
            },
        });
        if (!res.ok) {
            const err = await res.text();
            throw new AppError('unavailable', `Error consultando estado en PayPhone: ${err}`, 502);
        }
        const data = (await res.json());
        const status = (data.transactionStatus || 'Pending');
        const amountInUsd = typeof data.amount === 'number' ? data.amount / 100 : 0;
        return {
            transactionId: data.transactionId || paymentId,
            status,
            amount: amountInUsd,
            cardToken: data.cardToken,
            authorizationCode: data.authorizationCode,
        };
    }
    /**
     * Cobra recurrentemente usando un token de tarjeta (CardToken).
     */
    async chargeWithToken(config, cardTokenId, amount, reference, clientTxId) {
        if (!config.token) {
            throw new AppError('failed-precondition', 'PAYPHONE_SAAS_TOKEN no configurado', 503);
        }
        const amountInCents = Math.round(amount * 100);
        const url = `${this.getBaseUrl(config.environment)}/v2/Payment/SaleWithToken`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.token}`,
            },
            body: JSON.stringify({
                cardToken: cardTokenId,
                amount: amountInCents,
                amountWithoutTax: amountInCents,
                amountWithTax: 0,
                tax: 0,
                currency: 'USD',
                reference,
                clientTransactionId: clientTxId,
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new AppError('unavailable', `Rechazo de cargo recurrente PayPhone: ${err}`, 502);
        }
        const data = (await res.json());
        return {
            transactionId: data.transactionId || clientTxId,
            status: (data.transactionStatus || 'Approved'),
            amount,
            authorizationCode: data.authorizationCode,
        };
    }
}
export const payPhoneSaasClient = new PayPhoneSaasClient();
//# sourceMappingURL=payphoneSaas.js.map