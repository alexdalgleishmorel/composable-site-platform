import { createHandlers } from './handlers';
import { createPreTokenHandler } from './preToken';
import { createS3Presigner } from './presign';
import {
  createDynamoStore,
  createTenantMap,
  createTenantMapReader,
  createTenantRegistry,
} from './store';

/**
 * Lambda entry points, wired from environment variables set by `infra/shared` (#12-#15). Each export
 * is an API Gateway HTTP API integration target. The shared backend is deployed once and untouched
 * per client.
 */
const handlers = createHandlers({
  store: createDynamoStore(process.env.CONTENT_TABLE ?? ''),
  presigner: createS3Presigner({
    bucket: process.env.UPLOAD_BUCKET ?? '',
    cdnBase: process.env.CDN_BASE_URL ?? '',
  }),
  tenants: createTenantRegistry(process.env.TENANTS_TABLE ?? ''),
  tenantMap: createTenantMapReader(process.env.TENANT_MAP_TABLE ?? ''),
  // Comma-separated platform-owner emails (the owner-console authz gate).
  ownerEmails: (process.env.OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
});

export const getContent = handlers.getContent;
export const putContent = handlers.putContent;
export const uploadsPresign = handlers.uploadsPresign;

// Owner console (#owner): identity reflection, client list, per-tenant block provisioning.
export const whoami = handlers.whoami;
export const listTenants = handlers.listTenants;
export const setTenantBlocks = handlers.setTenantBlocks;

/** Cognito pre-token-generation trigger — injects custom:tenantId for federated users (#14). */
export const preTokenGeneration = createPreTokenHandler({
  tenantMap: createTenantMap(process.env.TENANT_MAP_TABLE ?? ''),
});
