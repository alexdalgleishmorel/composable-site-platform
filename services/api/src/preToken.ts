import type { PreTokenGenerationTriggerEvent } from 'aws-lambda';
import type { TenantMap } from './store';

/**
 * Cognito pre-token-generation trigger. Looks up the signed-in email in the tenant map and injects
 * the `custom:tenantId` claim into the ID token. This is what makes FEDERATED Google sign-ins carry
 * the tenant — a federated user is a different identity than any pre-created native user, so the
 * claim has to be added at token time (§8). Unmapped emails get no claim (the admin then refuses).
 */
export function createPreTokenHandler(deps: { tenantMap: TenantMap }) {
  return async (event: PreTokenGenerationTriggerEvent): Promise<PreTokenGenerationTriggerEvent> => {
    const email = event.request.userAttributes['email'];
    const tenantId = email ? await deps.tenantMap.lookup(email.toLowerCase()) : null;
    if (tenantId) {
      event.response = {
        claimsOverrideDetails: {
          // Both the namespaced and plain forms, so the admin can read either.
          claimsToAddOrOverride: { 'custom:tenantId': tenantId, tenantId },
        },
      };
    }
    return event;
  };
}
