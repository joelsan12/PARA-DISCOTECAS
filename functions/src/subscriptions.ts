/**
 * Motor de Suscripciones SaaS y Facturación de NIGHTFLOW
 * Fase C - Flujo B (PayPhone / Manual / Trial de 30 días)
 */

import { FieldValue } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { db } from './config.js';
import { AppError } from './errors.js';
import { callableUid, isSuperAdmin, requireStaff } from './auth.js';
import { writeAudit } from './audit.js';
import {
  asRecord,
  assertAllowedKeys,
  optionalNumber,
  optionalString,
  requiredId,
  requiredString,
} from './validation.js';
import {
  CANONICAL_PLANS,
  type BillingCycle,
  type CanonicalPlanId,
  type PlatformSubscriptionRecord,
  type SubscriptionData,
  type SubscriptionPaymentMethod,
  type SubscriptionStatus,
} from './types/subscription.js';
import { payPhoneSaasClient, type PayPhoneConfig } from './providers/payphoneSaas.js';
import { randomBytes } from 'node:crypto';

export function normalizeToCanonicalPlanId(planId: string): CanonicalPlanId {
  const p = planId.toLowerCase().trim();
  if (p === 'beta_vip' || p === 'beta' || p === 'beta privada') return 'beta_vip';
  if (p === 'black_vip' || p === 'black' || p === 'enterprise' || p === 'empresarial') return 'black_vip';
  if (p === 'club_pro' || p === 'pro' || p === 'profesional') return 'club_pro';
  if (p === 'starter' || p === 'starter club' || p === 'basico' || p === 'basic') return 'starter';
  return 'free';
}

function getPayPhoneConfig(): PayPhoneConfig {
  return {
    token: process.env.PAYPHONE_SAAS_TOKEN || '',
    storeId: process.env.PAYPHONE_SAAS_STORE_ID || undefined,
    environment: process.env.PAYPHONE_ENV === 'production' ? 'production' : 'sandbox',
  };
}

// ---------------------------------------------------------------------------
// 1. Obtener Suscripción Actual
// ---------------------------------------------------------------------------

export async function getBusinessSubscriptionFor(businessId: string, authUid: string | null) {
  if (!authUid) {
    throw new AppError('unauthenticated', 'Autenticación requerida para consultar suscripción', 401);
  }

  const superAdmin = await isSuperAdmin(authUid);
  if (!superAdmin) {
    await requireStaff(authUid, businessId, 'manager');
  }

  const subDoc = await db.collection('businesses').doc(businessId).collection('private').doc('subscription').get();
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  const bizData = bizDoc.exists ? bizDoc.data() : null;
  const currentPlan = bizData?.planId ? normalizeToCanonicalPlanId(String(bizData.planId)) : 'free';

  if (!subDoc.exists) {
    const isBetaFounder = currentPlan === 'beta_vip';
    const now = Date.now();
    return {
      businessId,
      planId: currentPlan,
      cycle: 'monthly' as BillingCycle,
      status: (isBetaFounder ? 'active' : 'trialing') as SubscriptionStatus,
      trialEndsAt: isBetaFounder ? now + 10 * 365 * 86400000 : now + 30 * 86400000,
      currentPeriodEnd: isBetaFounder ? now + 10 * 365 * 86400000 : now + 30 * 86400000,
      paymentMethod: 'none' as SubscriptionPaymentMethod,
      startedAt: now,
      updatedAt: now,
      isFounderBypass: isBetaFounder,
    };
  }

  const subData = subDoc.data() as SubscriptionData;
  return {
    ...subData,
    isFounderBypass: currentPlan === 'beta_vip',
  };
}

export async function getBusinessSubscription(request: CallableRequest<unknown>) {
  const uid = callableUid(request);
  const record = asRecord(request.data, 'getBusinessSubscription input');
  assertAllowedKeys(record, ['businessId']);
  const businessId = requiredId(record, 'businessId');
  return getBusinessSubscriptionFor(businessId, uid);
}

// ---------------------------------------------------------------------------
// 2. Seleccionar Plan de Suscripción (Dueño o Superadmin)
// ---------------------------------------------------------------------------

export interface SelectPlanInput {
  businessId: string;
  planId: string;
  cycle?: 'monthly' | 'annual' | undefined;
  paymentMethod?: SubscriptionPaymentMethod | undefined;
  responseUrl?: string | undefined;
}

export function parseSelectPlanInput(value: unknown): SelectPlanInput {
  const record = asRecord(value, 'select subscription plan');
  assertAllowedKeys(record, ['businessId', 'planId', 'cycle', 'paymentMethod', 'responseUrl']);
  const businessId = requiredId(record, 'businessId');
  const planId = requiredString(record, 'planId', 2, 40);
  const cycle = (optionalString(record, 'cycle', 2, 20) as 'monthly' | 'annual') || 'monthly';
  const paymentMethod = (optionalString(record, 'paymentMethod', 2, 30) as SubscriptionPaymentMethod) || 'none';
  const responseUrl = optionalString(record, 'responseUrl', 10, 500);

  return { businessId, planId, cycle, paymentMethod, responseUrl };
}

export async function selectSubscriptionPlanFor(input: SelectPlanInput, authUid: string | null) {
  if (!authUid) {
    throw new AppError('unauthenticated', 'Autenticación requerida para contratar o actualizar plan', 401);
  }

  const superAdmin = await isSuperAdmin(authUid);
  if (!superAdmin) {
    await requireStaff(authUid, input.businessId, 'owner');
  }

  const canonicalPlan = normalizeToCanonicalPlanId(input.planId);
  const planDef = CANONICAL_PLANS[canonicalPlan];
  const now = Date.now();

  const bizRef = db.collection('businesses').doc(input.businessId);
  const subRef = bizRef.collection('private').doc('subscription');
  const subSnap = await subRef.get();
  const existingSub = subSnap.exists ? (subSnap.data() as SubscriptionData) : null;

  // Plan Lounge Free
  if (canonicalPlan === 'free') {
    const periodEnd = now + 10 * 365 * 86400000;
    await subRef.set(
      {
        businessId: input.businessId,
        planId: 'free',
        cycle: 'monthly',
        status: 'active',
        currentPeriodEnd: periodEnd,
        paymentMethod: 'none',
        updatedAt: now,
      },
      { merge: true }
    );
    await bizRef.set({ planId: 'free', enabled_features: planDef.features }, { merge: true });

    return {
      success: true,
      planId: 'free',
      status: 'active',
      currentPeriodEnd: periodEnd,
    };
  }

  // Planes de pago: Starter Club, Club Pro, Black VIP
  // Regla de Negocio: Si el establecimiento nunca ha disfrutado de Trial, se activa el Trial de 30 días sin costo
  const hasUsedTrial = Boolean(existingSub && existingSub.trialEndsAt);
  if (!hasUsedTrial) {
    const trialDays = 30;
    const trialEndsAt = now + trialDays * 24 * 60 * 60 * 1000;

    await subRef.set(
      {
        businessId: input.businessId,
        planId: canonicalPlan,
        cycle: input.cycle || 'monthly',
        status: 'trialing',
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
        paymentMethod: input.paymentMethod || 'none',
        startedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await bizRef.set({ planId: canonicalPlan, enabled_features: planDef.features }, { merge: true });

    await writeAudit(
      'subscription.trial_started',
      'business',
      input.businessId,
      {
        businessId: input.businessId,
        actorUid: authUid,
        actorRole: superAdmin ? 'superadmin' : 'owner',
      },
      {
        planId: canonicalPlan,
        trialEndsAt,
        durationDays: trialDays,
      }
    );

    return {
      success: true,
      trialGranted: true,
      status: 'trialing',
      planId: canonicalPlan,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    };
  }

  // Si ya agotó el trial o renueva, procesar método de pago seleccionado
  const amount = input.cycle === 'annual' ? planDef.annualPrice : planDef.monthlyPrice;

  // Opción 1: Transferencia Bancaria Manual
  if (input.paymentMethod === 'transfer') {
    const txId = `sub_tx_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const ledgerRef = db.collection('platformSubscriptions').doc(txId);

    const record: PlatformSubscriptionRecord = {
      id: txId,
      businessId: input.businessId,
      planId: canonicalPlan,
      cycle: input.cycle || 'monthly',
      amount,
      currency: 'USD',
      method: 'transfer',
      periodStart: now,
      periodEnd: now + (input.cycle === 'annual' ? 365 : 30) * 86400000,
      status: 'PENDING',
      actorUid: authUid,
      createdAt: now,
    };

    await ledgerRef.set(record);

    return {
      success: true,
      pendingTransfer: true,
      reference: txId,
      amount,
      planId: canonicalPlan,
      cycle: input.cycle,
    };
  }

  // Opción 2: Pasarela PayPhone Business
  if (input.paymentMethod === 'payphone_sale' || input.paymentMethod === 'payphone_token') {
    const config = getPayPhoneConfig();
    const clientTxId = `saas_${input.businessId}_${Date.now()}`;
    const responseUrl = input.responseUrl || 'https://nightflow-vip.web.app/admin';

    const session = await payPhoneSaasClient.preparePayment(config, {
      businessId: input.businessId,
      planId: canonicalPlan,
      amount,
      reference: `Plan ${planDef.name} (${input.cycle})`,
      clientTransactionId: clientTxId,
      responseUrl,
    });

    // Guardar intención en ledger
    const ledgerRef = db.collection('platformSubscriptions').doc(clientTxId);
    await ledgerRef.set({
      id: clientTxId,
      businessId: input.businessId,
      planId: canonicalPlan,
      cycle: input.cycle || 'monthly',
      amount,
      currency: 'USD',
      method: input.paymentMethod,
      payphonePaymentId: session.paymentId,
      periodStart: now,
      periodEnd: now + (input.cycle === 'annual' ? 365 : 30) * 86400000,
      status: 'PENDING',
      actorUid: authUid,
      createdAt: now,
    });

    return {
      success: true,
      checkoutUrl: session.payUrl,
      paymentId: session.paymentId,
      clientTransactionId: clientTxId,
    };
  }

  throw new AppError('invalid-argument', 'Método de pago de suscripción no especificado o inválido', 400);
}

export async function selectSubscriptionPlan(request: CallableRequest<unknown>) {
  const uid = callableUid(request);
  const input = parseSelectPlanInput(request.data);
  return selectSubscriptionPlanFor(input, uid);
}

// ---------------------------------------------------------------------------
// 3. Registrar Transferencia de Suscripción (Superadmin)
// ---------------------------------------------------------------------------

export interface RegisterTransferInput {
  businessId: string;
  planId: string;
  cycle?: 'monthly' | 'annual' | undefined;
  amount: number;
  reference?: string | undefined;
  notes?: string | undefined;
}

export async function registerSubscriptionTransferFor(input: RegisterTransferInput, authUid: string | null) {
  if (!authUid) {
    throw new AppError('unauthenticated', 'Autenticación requerida', 401);
  }
  const superAdmin = await isSuperAdmin(authUid);
  if (!superAdmin) {
    throw new AppError('permission-denied', 'Solo el superadministrador puede registrar transferencias de suscripción', 403);
  }

  const canonicalPlan = normalizeToCanonicalPlanId(input.planId);
  const planDef = CANONICAL_PLANS[canonicalPlan];
  const now = Date.now();
  const daysToAdd = input.cycle === 'annual' ? 365 : 30;

  const bizRef = db.collection('businesses').doc(input.businessId);
  const subRef = bizRef.collection('private').doc('subscription');
  const subSnap = await subRef.get();
  const currentEnd = subSnap.exists && typeof subSnap.data()?.currentPeriodEnd === 'number'
    ? (subSnap.data()!.currentPeriodEnd as number)
    : now;

  const newPeriodEnd = Math.max(now, currentEnd) + daysToAdd * 86400000;

  await subRef.set(
    {
      businessId: input.businessId,
      planId: canonicalPlan,
      cycle: input.cycle || 'monthly',
      status: 'active',
      currentPeriodEnd: newPeriodEnd,
      paymentMethod: 'transfer',
      updatedAt: now,
    },
    { merge: true }
  );

  await bizRef.set({ planId: canonicalPlan, enabled_features: planDef.features }, { merge: true });

  const txId = `sub_manual_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await db.collection('platformSubscriptions').doc(txId).set({
    id: txId,
    businessId: input.businessId,
    planId: canonicalPlan,
    cycle: input.cycle || 'monthly',
    amount: input.amount,
    currency: 'USD',
    method: 'transfer',
    reference: input.reference || 'Transferencia Bancaria',
    periodStart: now,
    periodEnd: newPeriodEnd,
    status: 'PAID',
    actorUid: authUid,
    notes: input.notes ?? null,
    createdAt: now,
  });

  await writeAudit(
    'subscription.transfer_registered',
    'business',
    input.businessId,
    {
      businessId: input.businessId,
      actorUid: authUid,
      actorRole: 'superadmin',
    },
    {
      planId: canonicalPlan,
      amount: input.amount,
      newPeriodEnd,
      reference: input.reference ?? null,
    }
  );

  return {
    success: true,
    status: 'active',
    planId: canonicalPlan,
    currentPeriodEnd: newPeriodEnd,
  };
}

export async function registerSubscriptionTransfer(request: CallableRequest<unknown>) {
  const uid = callableUid(request);
  const record = asRecord(request.data, 'registerSubscriptionTransfer input');
  assertAllowedKeys(record, ['businessId', 'planId', 'cycle', 'amount', 'reference', 'notes']);

  const businessId = requiredId(record, 'businessId');
  const planId = requiredString(record, 'planId', 2, 40);
  const cycle = (optionalString(record, 'cycle', 2, 20) as 'monthly' | 'annual') || 'monthly';
  const amount = optionalNumber(record, 'amount', 0, 10000) ?? 0;
  const reference = optionalString(record, 'reference', 1, 100);
  const notes = optionalString(record, 'notes', 1, 500);

  return registerSubscriptionTransferFor({ businessId, planId, cycle, amount, reference, notes }, uid);
}

// ---------------------------------------------------------------------------
// 4. Modificación Manual de Estado de Suscripción (Superadmin)
// ---------------------------------------------------------------------------

export interface UpdateSubscriptionStatusInput {
  businessId: string;
  status: SubscriptionStatus;
  planId?: string | undefined;
  extendDays?: number | undefined;
  notes?: string | undefined;
}

export async function updateSubscriptionStatusManualFor(
  input: UpdateSubscriptionStatusInput,
  authUid: string | null
) {
  if (!authUid) {
    throw new AppError('unauthenticated', 'Autenticación requerida', 401);
  }
  const superAdmin = await isSuperAdmin(authUid);
  if (!superAdmin) {
    throw new AppError('permission-denied', 'Solo el superadministrador puede alterar el estado de suscripción', 403);
  }

  const now = Date.now();
  const bizRef = db.collection('businesses').doc(input.businessId);
  const subRef = bizRef.collection('private').doc('subscription');
  const subSnap = await subRef.get();

  const currentEnd = subSnap.exists && typeof subSnap.data()?.currentPeriodEnd === 'number'
    ? (subSnap.data()!.currentPeriodEnd as number)
    : now;

  const newPeriodEnd = input.extendDays
    ? Math.max(now, currentEnd) + input.extendDays * 86400000
    : currentEnd;

  const updates: Record<string, unknown> = {
    status: input.status,
    currentPeriodEnd: newPeriodEnd,
    updatedAt: now,
  };

  if (input.planId) {
    const canonicalPlan = normalizeToCanonicalPlanId(input.planId);
    updates.planId = canonicalPlan;
    const planDef = CANONICAL_PLANS[canonicalPlan];
    await bizRef.set({ planId: canonicalPlan, enabled_features: planDef.features }, { merge: true });
  }

  await subRef.set(updates, { merge: true });

  await writeAudit(
    'subscription.status_updated',
    'business',
    input.businessId,
    {
      businessId: input.businessId,
      actorUid: authUid,
      actorRole: 'superadmin',
    },
    {
      status: input.status,
      newPeriodEnd,
      extendDays: input.extendDays ?? null,
      notes: input.notes ?? null,
    }
  );

  return {
    success: true,
    status: input.status,
    currentPeriodEnd: newPeriodEnd,
  };
}

export async function updateSubscriptionStatusManual(request: CallableRequest<unknown>) {
  const uid = callableUid(request);
  const record = asRecord(request.data, 'updateSubscriptionStatusManual input');
  assertAllowedKeys(record, ['businessId', 'status', 'planId', 'extendDays', 'notes']);

  const businessId = requiredId(record, 'businessId');
  const status = requiredString(record, 'status', 2, 20) as SubscriptionStatus;
  const planId = optionalString(record, 'planId', 2, 40);
  const extendDays = optionalNumber(record, 'extendDays', -365, 365);
  const notes = optionalString(record, 'notes', 1, 500);

  return updateSubscriptionStatusManualFor({ businessId, status, planId, extendDays, notes }, uid);
}

// ---------------------------------------------------------------------------
// 5. Listar Ledgers de Plataforma (Superadmin)
// ---------------------------------------------------------------------------

export async function listPlatformSubscriptionsFor(authUid: string | null, limit = 50) {
  if (!authUid) {
    throw new AppError('unauthenticated', 'Autenticación requerida', 401);
  }
  const superAdmin = await isSuperAdmin(authUid);
  if (!superAdmin) {
    throw new AppError('permission-denied', 'Solo el superadministrador puede consultar el ledger SaaS', 403);
  }

  const snap = await db
    .collection('platformSubscriptions')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const records = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { records, count: records.length };
}

export async function listPlatformSubscriptions(request: CallableRequest<unknown>) {
  const uid = callableUid(request);
  const record = asRecord(request.data ?? {}, 'listPlatformSubscriptions input');
  assertAllowedKeys(record, ['limit']);
  const limit = optionalNumber(record, 'limit', 1, 100) ?? 50;
  return listPlatformSubscriptionsFor(uid, limit);
}

// ---------------------------------------------------------------------------
// 6. Enforcement de Suscripción (Helper para callables críticos)
// ---------------------------------------------------------------------------

export async function requireActiveSubscription(businessId: string): Promise<void> {
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  if (!bizDoc.exists) return; // Validación de existencia corre en cada callable

  const bizData = bizDoc.data();
  const planId = bizData?.planId ? String(bizData.planId).toLowerCase() : 'free';

  // Clubes fundadores (beta_vip) tienen bypass total permanente
  if (planId === 'beta_vip' || planId === 'beta') {
    return;
  }

  const subDoc = await db.collection('businesses').doc(businessId).collection('private').doc('subscription').get();
  if (!subDoc.exists) {
    return; // Si aún no tiene documento de suscripción, opera con política inicial abierta
  }

  const sub = subDoc.data() as SubscriptionData;
  if (sub.status === 'expired') {
    throw new AppError(
      'permission-denied',
      'El plan de suscripción de este establecimiento ha expirado. Por favor reactiva tu plan en la consola del club para habilitar nuevas reservas.',
      402
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Webhook NotificacionPago de PayPhone (Flujo B)
// ---------------------------------------------------------------------------

export async function handlePayPhoneWebhook(req: { body: unknown }, res: { status: (code: number) => { json: (data: unknown) => void; send: (msg: string) => void } }) {
  const body = (req.body || {}) as Record<string, unknown>;
  const paymentId = body.id || body.paymentId;
  const clientTxId = String(body.clientTxId || body.clientTransactionId || '');

  if (!paymentId || !clientTxId) {
    res.status(400).json({ error: 'Faltan parámetros requeridos de PayPhone (id, clientTxId)' });
    return;
  }

  try {
    const config = getPayPhoneConfig();
    const confirmed = await payPhoneSaasClient.confirmPayment(config, paymentId as number, clientTxId);

    if (confirmed.status === 'Approved') {
      const ledgerRef = db.collection('platformSubscriptions').doc(clientTxId);
      const ledgerSnap = await ledgerRef.get();
      if (ledgerSnap.exists) {
        const data = ledgerSnap.data()!;
        const businessId = String(data.businessId);
        const planId = normalizeToCanonicalPlanId(String(data.planId));
        const cycle = (data.cycle as BillingCycle) || 'monthly';
        const days = cycle === 'annual' ? 365 : 30;
        const now = Date.now();

        await ledgerRef.update({
          status: 'PAID',
          payphoneTransactionId: String(confirmed.transactionId),
          cardToken: confirmed.cardToken || FieldValue.delete(),
          authorizationCode: confirmed.authorizationCode || '',
          updatedAt: now,
        });

        const subRef = db.collection('businesses').doc(businessId).collection('private').doc('subscription');
        const subSnap = await subRef.get();
        const currentEnd = subSnap.exists && typeof subSnap.data()?.currentPeriodEnd === 'number'
          ? (subSnap.data()!.currentPeriodEnd as number)
          : now;
        const newPeriodEnd = Math.max(now, currentEnd) + days * 86400000;

        await subRef.set(
          {
            businessId,
            planId,
            cycle,
            status: 'active',
            currentPeriodEnd: newPeriodEnd,
            paymentMethod: confirmed.cardToken ? 'payphone_token' : 'payphone_sale',
            ...(confirmed.cardToken ? { payphoneCardTokenId: confirmed.cardToken } : {}),
            updatedAt: now,
          },
          { merge: true }
        );

        const planDef = CANONICAL_PLANS[planId];
        await db.collection('businesses').doc(businessId).set(
          {
            planId,
            enabled_features: planDef.features,
          },
          { merge: true }
        );
      }
    }

    res.status(200).json({ received: true, status: confirmed.status });
  } catch (error) {
    console.error('Error procesando webhook PayPhone:', error);
    res.status(502).json({ error: 'Fallo al procesar confirmación de PayPhone' });
  }
}

// ---------------------------------------------------------------------------
// 8. Ticker de Suscripciones (Degradación Suave & Días de Gracia)
// ---------------------------------------------------------------------------

export async function processSubscriptionTicker(): Promise<number> {
  const now = Date.now();
  let updatedCount = 0;

  try {
    const expiredSnap = await db
      .collectionGroup('subscription')
      .where('currentPeriodEnd', '<=', now)
      .limit(50)
      .get();

    for (const doc of expiredSnap.docs) {
      const sub = doc.data() as SubscriptionData;
      const businessId = sub.businessId || doc.ref.parent.parent?.id;
      if (!businessId) continue;

      const gracePeriodMs = 3 * 24 * 60 * 60 * 1000; // 3 días de gracia
      const diff = now - sub.currentPeriodEnd;

      if (diff < gracePeriodMs && sub.status !== 'past_due') {
        await doc.ref.update({ status: 'past_due', updatedAt: now });
        updatedCount++;
      } else if (diff >= gracePeriodMs && sub.status !== 'expired') {
        await doc.ref.update({ status: 'expired', updatedAt: now });
        await db.collection('businesses').doc(businessId).set(
          {
            planId: 'free',
            enabled_features: CANONICAL_PLANS.free.features,
          },
          { merge: true }
        );
        updatedCount++;
      }
    }
  } catch {
    // Si no hay índice de collectionGroup aún en desarrollo, ignora silenciosamente
  }

  return updatedCount;
}
