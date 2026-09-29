import type { Club, SubscriptionPlanId } from '../types';

/**
 * @deprecated AGENTS §10 & §2.1: El aprovisionamiento de discotecas en el cliente está prohibido.
 * Utiliza store.createClub(...) respaldado por la Cloud Function `createBusinessTenant`.
 */
export function createClubOperation(): never {
  throw new Error('AGENTS §10: El aprovisionamiento de clubes no puede realizarse localmente. Debe invocarse la Cloud Function createBusinessTenant.');
}

export function toggleClubStatusOperation(clubs: Club[], clubId: string): Club | undefined {
  const club = clubs.find(c => c.id === clubId);
  if (club) {
    club.status = club.status === 'active' ? 'suspended' : 'active';
  }
  return club;
}

export function updateClubPlanOperation(clubs: Club[], clubId: string, newPlanId: SubscriptionPlanId): Club | undefined {
  const club = clubs.find(c => c.id === clubId);
  if (club) {
    club.plan_id = newPlanId;
  }
  return club;
}
