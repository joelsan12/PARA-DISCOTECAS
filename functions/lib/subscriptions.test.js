import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT ||= 'demo-nightflow';
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
const { getBusinessSubscriptionFor, selectSubscriptionPlanFor, registerSubscriptionTransferFor, updateSubscriptionStatusManualFor, requireActiveSubscription, listPlatformSubscriptionsFor, } = await import('./subscriptions.js');
const { db } = await import('./config.js');
describe('Fase C — Motor de Suscripciones SaaS (Flujo B)', () => {
    const testBizFounder = `biz_founder_${Date.now()}`;
    const testBizNew = `biz_new_${Date.now()}`;
    const testBizExpired = `biz_expired_${Date.now()}`;
    const superAdminUid = `sa_${Date.now()}`;
    const ownerUid = `owner_${Date.now()}`;
    const doorUid = `door_${Date.now()}`;
    it('Setup: siembra datos de prueba en Firestore', async () => {
        // SuperAdmin
        await db.collection('users').doc(superAdminUid).set({ superAdmin: true });
        // Club Founder (beta_vip)
        await db.collection('businesses').doc(testBizFounder).set({
            name: 'Founder Club',
            planId: 'beta_vip',
            status: 'active',
        });
        // Club Nuevo
        await db.collection('businesses').doc(testBizNew).set({
            name: 'New Tenant Club',
            planId: 'starter',
            status: 'active',
        });
        await db.collection('businesses').doc(testBizNew).collection('staff').doc(ownerUid).set({
            role: 'owner',
            status: 'ACTIVE',
        });
        await db.collection('businesses').doc(testBizNew).collection('staff').doc(doorUid).set({
            role: 'door',
            status: 'ACTIVE',
        });
        // Club Expirado
        await db.collection('businesses').doc(testBizExpired).set({
            name: 'Expired Club',
            planId: 'free',
            status: 'active',
        });
        await db.collection('businesses').doc(testBizExpired).collection('private').doc('subscription').set({
            businessId: testBizExpired,
            planId: 'starter',
            cycle: 'monthly',
            status: 'expired',
            currentPeriodEnd: Date.now() - 5 * 86400000,
        });
    });
    describe('getBusinessSubscriptionFor', () => {
        it('Rechaza llamada sin autenticación (401)', async () => {
            await assert.rejects(() => getBusinessSubscriptionFor(testBizNew, null), (err) => err.code === 'unauthenticated' && err.status === 401);
        });
        it('Rechaza a un usuario sin permisos suficientes en el club (403)', async () => {
            await assert.rejects(() => getBusinessSubscriptionFor(testBizNew, doorUid), (err) => err.code === 'permission-denied' && err.status === 403);
        });
        it('Devuelve bypass y estado activo para un club fundador beta_vip', async () => {
            const res = await getBusinessSubscriptionFor(testBizFounder, superAdminUid);
            assert.equal(res.planId, 'beta_vip');
            assert.equal(res.status, 'active');
            assert.equal(res.isFounderBypass, true);
        });
        it('Devuelve trial por defecto para un nuevo club sin suscripción previa', async () => {
            const res = await getBusinessSubscriptionFor(testBizNew, ownerUid);
            assert.equal(res.status, 'trialing');
            assert.ok(res.trialEndsAt > Date.now());
        });
    });
    describe('selectSubscriptionPlanFor', () => {
        it('Rechaza selección sin rol owner ni superadmin (403)', async () => {
            await assert.rejects(() => selectSubscriptionPlanFor({ businessId: testBizNew, planId: 'club_pro', cycle: 'monthly', paymentMethod: 'transfer' }, doorUid), (err) => err.code === 'permission-denied' && err.status === 403);
        });
        it('Otorga Trial de 30 días automáticamente al seleccionar un plan de pago por primera vez', async () => {
            const res = await selectSubscriptionPlanFor({ businessId: testBizNew, planId: 'club_pro', cycle: 'monthly', paymentMethod: 'transfer' }, ownerUid);
            assert.equal(res.trialGranted, true);
            assert.equal(res.status, 'trialing');
            assert.equal(res.planId, 'club_pro');
            assert.ok(res.trialEndsAt > Date.now() + 28 * 86400000);
            // Verifica actualización en businesses/{id}
            const bizSnap = await db.collection('businesses').doc(testBizNew).get();
            assert.equal(bizSnap.data()?.planId, 'club_pro');
        });
        it('Permite seleccionar plan Lounge Free y lo marca como activo sin costo', async () => {
            const res = await selectSubscriptionPlanFor({ businessId: testBizNew, planId: 'free', cycle: 'monthly', paymentMethod: 'none' }, ownerUid);
            assert.equal(res.status, 'active');
            assert.equal(res.planId, 'free');
        });
    });
    describe('registerSubscriptionTransferFor', () => {
        it('Rechaza llamada de un usuario que no es superadmin (403)', async () => {
            await assert.rejects(() => registerSubscriptionTransferFor({ businessId: testBizNew, planId: 'club_pro', cycle: 'monthly', amount: 15, reference: 'TRF-123' }, ownerUid), (err) => err.code === 'permission-denied' && err.status === 403);
        });
        it('Registra transferencia y extiende periodo exitosamente como superadmin', async () => {
            const res = await registerSubscriptionTransferFor({ businessId: testBizNew, planId: 'club_pro', cycle: 'monthly', amount: 15, reference: 'TRF-123' }, superAdminUid);
            assert.equal(res.success, true);
            assert.equal(res.status, 'active');
            assert.equal(res.planId, 'club_pro');
            assert.ok(res.currentPeriodEnd > Date.now() + 25 * 86400000);
            // Ledger en platformSubscriptions
            const ledger = await listPlatformSubscriptionsFor(superAdminUid, 10);
            assert.ok(ledger.records.length > 0);
            const firstRecord = ledger.records[0];
            assert.ok(firstRecord);
            assert.equal(firstRecord.method, 'transfer');
            assert.equal(firstRecord.status, 'PAID');
        });
    });
    describe('updateSubscriptionStatusManualFor', () => {
        it('Permite al superadmin extender días y alterar estado directamente', async () => {
            const res = await updateSubscriptionStatusManualFor({ businessId: testBizNew, status: 'active', extendDays: 60, notes: 'Promoción especial' }, superAdminUid);
            assert.equal(res.status, 'active');
            assert.ok(res.currentPeriodEnd > Date.now() + 50 * 86400000);
        });
    });
    describe('requireActiveSubscription (Enforcement)', () => {
        it('Permite acceso ilimitado a establecimientos fundadores beta_vip', async () => {
            await assert.doesNotReject(() => requireActiveSubscription(testBizFounder));
        });
        it('Permite acceso a clubes con suscripción activa o en trial', async () => {
            await assert.doesNotReject(() => requireActiveSubscription(testBizNew));
        });
        it('Bloquea con 402 cuando la suscripción de un club ha expirado', async () => {
            await assert.rejects(() => requireActiveSubscription(testBizExpired), (err) => err.status === 402 && err.code === 'permission-denied');
        });
    });
});
//# sourceMappingURL=subscriptions.test.js.map