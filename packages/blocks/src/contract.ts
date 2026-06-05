import type { FC } from 'react';
import type { z } from 'zod';

/**
 * The three-plane block contract from ARCHITECTURE.md §2. The `type` string is the join key across
 * all three planes:
 *
 * - **schema** (data plane)  — SHARED, validated. Lives in the registry.
 * - **EditForm** (editing)   — SHARED. Rendered by the one admin app.
 * - **Render** (presentation) — BESPOKE. Lives in each client bundle, NOT here.
 *
 * A `BlockType` therefore carries everything *shared* about a block type — never its render.
 */

export interface EditFormProps<T> {
  data: T;
  onChange: (next: T) => void;
}

/** The shared admin form for a block type. A React component (type-only dependency on react). */
export type EditFormComponent<T> = FC<EditFormProps<T>>;

export interface BlockType<T = unknown> {
  /** Registry key and the cross-plane join key (§2). */
  type: string;
  /** Human label for the admin block picker. */
  label: string;
  /** SHARED data contract — the validated shape of this block's `data`. */
  schema: z.ZodType<T>;
  /** SHARED editing UI — rendered by the admin app from the registry. */
  EditForm: EditFormComponent<T>;
  /** Default `data` for a freshly-added block (used by the admin "add from registry"). */
  defaultData: () => T;
  /**
   * Optional stricter validation beyond `schema` (e.g. the shop's money rules, §5). Throws on
   * invalid data; the message is surfaced as a content validation issue.
   */
  validate?: (data: T) => void;
}
