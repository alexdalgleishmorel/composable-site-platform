import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { TenantContent } from '@csp/core';

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
