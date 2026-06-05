import { tenantContentSchema, type TenantContent } from '@csp/core';
import type { z, ZodError } from 'zod';

/**
 * Content validation — React-free on purpose so the backend (`@csp/api`) can import it without
 * pulling EditForms (and therefore React) into the Lambda bundle. It works off a plain
 * `type -> schema` map plus optional per-type validators, which the registry produces via
 * `BlockRegistry.toValidators()`.
 */

export interface ContentValidators {
  /** Block `type` -> the Zod schema for that type's `data`. */
  schemas: Record<string, z.ZodType>;
  /** Block `type` -> an optional stricter validator that throws on invalid data. */
  validators?: Record<string, (data: unknown) => void>;
}

export interface ContentIssue {
  /** Human-readable location, e.g. `/shop » shop#abc123 > items.0.priceCents`. */
  path: string;
  message: string;
}

export type ValidateResult =
  | { ok: true; value: TenantContent }
  | { ok: false; issues: ContentIssue[] };

function zodIssues(prefix: string, error: ZodError): ContentIssue[] {
  return error.issues.map((issue) => ({
    path: [prefix, issue.path.join('.')].filter(Boolean).join(' > '),
    message: issue.message,
  }));
}

/**
 * Validate a raw value as a `TenantContent`: first the envelope structure, then each block's `data`
 * against its registered schema (and optional stricter validator). Returns every issue found, not
 * just the first, so the admin can surface them all at once.
 */
export function validateContent(content: ContentValidators, raw: unknown): ValidateResult {
  const envelope = tenantContentSchema.safeParse(raw);
  if (!envelope.success) return { ok: false, issues: zodIssues('', envelope.error) };

  const issues: ContentIssue[] = [];
  for (const page of envelope.data.pages) {
    for (const block of page.blocks) {
      const at = `${page.slug} » ${block.type}#${block.id}`;
      const schema = content.schemas[block.type];
      if (!schema) {
        issues.push({ path: at, message: `unknown block type "${block.type}"` });
        continue;
      }
      const parsed = schema.safeParse(block.data);
      if (!parsed.success) {
        issues.push(...zodIssues(at, parsed.error));
        continue;
      }
      const validator = content.validators?.[block.type];
      if (validator) {
        try {
          validator(parsed.data);
        } catch (error) {
          issues.push({
            path: at,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true, value: envelope.data };
}
