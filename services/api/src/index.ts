import { createHandlers } from './handlers';
import { createPreTokenHandler } from './preToken';
import { createS3Presigner } from './presign';
import { createDynamoStore, createTenantMap } from './store';

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
});

export const getContent = handlers.getContent;
export const putContent = handlers.putContent;
export const uploadsPresign = handlers.uploadsPresign;

/** Cognito pre-token-generation trigger — injects custom:tenantId for federated users (#14). */
export const preTokenGeneration = createPreTokenHandler({
  tenantMap: createTenantMap(process.env.TENANT_MAP_TABLE ?? ''),
});
