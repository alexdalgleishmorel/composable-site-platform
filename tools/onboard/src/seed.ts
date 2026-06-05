import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { contentValidators, validateContent } from '@csp/blocks/schemas';
import type { TenantContent } from '@csp/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Seed a tenant's content straight into DynamoDB (no admin login needed) so a site can go live before
 * Google auth is wired. Loads `clients/<client>/bundle/src/seed.ts`'s exported `seed`, validates it
 * with the SAME shared validators the API uses, then PUTs it.
 *
 * Usage: pnpm --filter @csp/onboard seed -- --client jmdm [--table csp-content] [--region us-east-1]
 */
function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]!;
  if (fallback !== undefined) return fallback;
  throw new Error(`missing required --${name}`);
}

const client = arg('client');
const table = arg('table', 'csp-content');
const region = arg('region', process.env.AWS_REGION ?? 'us-east-1');

const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(here, '../../../clients', client, 'bundle/src/seed.ts');

const mod = (await import(seedPath)) as { seed?: TenantContent };
if (!mod.seed) throw new Error(`clients/${client}/bundle/src/seed.ts must export \`seed\``);
const content = mod.seed;

const result = validateContent(contentValidators, content);
if (!result.ok) {
  console.error(
    `Seed is invalid — refusing to write:\n${result.issues.map((i) => `  ${i.path}: ${i.message}`).join('\n')}`,
  );
  process.exit(1);
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
await doc.send(
  new PutCommand({ TableName: table, Item: { ...content, updatedAt: new Date().toISOString() } }),
);

console.log(`Seeded ${content.tenantId} (${content.pages.length} pages) into ${table}.`);
