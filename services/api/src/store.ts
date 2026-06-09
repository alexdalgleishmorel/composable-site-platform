import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { TenantContent, TenantRecord } from '@csp/core';

/** One DynamoDB item per tenant: `{ tenantId, siteMeta, pages, updatedAt }` (§5). */
export interface ContentStore {
  get(tenantId: string): Promise<TenantContent | null>;
  put(content: TenantContent): Promise<void>;
}

export function createDynamoStore(
  tableName: string,
  client: DynamoDBClient = new DynamoDBClient({}),
): ContentStore {
  const doc = DynamoDBDocumentClient.from(client);
  return {
    async get(tenantId) {
      const res = await doc.send(new GetCommand({ TableName: tableName, Key: { tenantId } }));
      return (res.Item as TenantContent | undefined) ?? null;
    },
    async put(content) {
      await doc.send(new PutCommand({ TableName: tableName, Item: content }));
    },
  };
}

/** Maps an allow-listed email -> tenantId. Written per-tenant by `infra/tenant`, read by the
 * pre-token Lambda so FEDERATED (Google) users get their `custom:tenantId` claim (§8). */
export interface TenantMap {
  lookup(email: string): Promise<string | null>;
}

export function createTenantMap(
  tableName: string,
  client: DynamoDBClient = new DynamoDBClient({}),
): TenantMap {
  const doc = DynamoDBDocumentClient.from(client);
  return {
    async lookup(email) {
      const res = await doc.send(new GetCommand({ TableName: tableName, Key: { email } }));
      return (res.Item?.tenantId as string | undefined) ?? null;
    },
  };
}

/** Reads every `email -> tenantId` mapping. Used by the owner console to discover live tenants even
 * before they have a `csp-tenants` row (so the client list is correct with no backfill). */
export interface TenantMapReader {
  entries(): Promise<{ email: string; tenantId: string }[]>;
}

export function createTenantMapReader(
  tableName: string,
  client: DynamoDBClient = new DynamoDBClient({}),
): TenantMapReader {
  const doc = DynamoDBDocumentClient.from(client);
  return {
    async entries() {
      const res = await doc.send(new ScanCommand({ TableName: tableName }));
      return (res.Items ?? []).flatMap((i) => {
        const email = i.email as string | undefined;
        const tenantId = i.tenantId as string | undefined;
        return email && tenantId ? [{ email, tenantId }] : [];
      });
    },
  };
}

/** The platform-owner's tenant registry (`csp-tenants`): the client list and per-tenant block
 * allow-list (§ owner console). Separate from `ContentStore` so client content edits never touch
 * provisioning. */
export interface TenantRegistry {
  get(tenantId: string): Promise<TenantRecord | null>;
  list(): Promise<TenantRecord[]>;
  /** Upsert a tenant's allow-list. `null`/`[]` clears it (⇒ all blocks allowed); a non-empty array
   * restricts. Creates the row (status `active`, `displayName` defaulting to the id) if absent. */
  putBlocks(tenantId: string, blocks: string[] | null, now: string): Promise<void>;
}

export function createTenantRegistry(
  tableName: string,
  client: DynamoDBClient = new DynamoDBClient({}),
): TenantRegistry {
  const doc = DynamoDBDocumentClient.from(client);
  return {
    async get(tenantId) {
      const res = await doc.send(new GetCommand({ TableName: tableName, Key: { tenantId } }));
      return (res.Item as TenantRecord | undefined) ?? null;
    },
    async list() {
      const res = await doc.send(new ScanCommand({ TableName: tableName }));
      return (res.Items ?? []) as TenantRecord[];
    },
    async putBlocks(tenantId, blocks, now) {
      // `status` is a reserved word; alias it. Set defaults only on first write (if_not_exists).
      const base =
        'SET displayName = if_not_exists(displayName, :tid), #s = if_not_exists(#s, :active), ' +
        'createdAt = if_not_exists(createdAt, :now), updatedAt = :now';
      const restrict = blocks && blocks.length > 0;
      await doc.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { tenantId },
          UpdateExpression: restrict ? `${base}, blocks = :blocks` : `${base} REMOVE blocks`,
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':tid': tenantId,
            ':active': 'active',
            ':now': now,
            ...(restrict ? { ':blocks': blocks } : {}),
          },
        }),
      );
    },
  };
}
