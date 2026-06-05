import { newId } from '@csp/core';
import { z } from 'zod';

/** A single project — carried over verbatim from the old fixed schema, now block `data` (§5). */
export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string(), // may be empty while drafting; the render falls back to "(untitled)"
  summary: z.string().optional(), // short card text
  body: z.string().optional(), // full description
  images: z.array(z.string().url()), // CDN URLs
  link: z.string().url().optional(), // external link
  tags: z.array(z.string()).optional(),
  order: z.number().int().nonnegative(), // display order within the grid
});
export type Project = z.infer<typeof projectSchema>;

/** type: "projectGrid" — the Projects page / home index (§5). */
export const projectGridSchema = z.object({
  projects: z.array(projectSchema),
});
export type ProjectGridData = z.infer<typeof projectGridSchema>;

export const projectGridDefault = (): ProjectGridData => ({ projects: [] });

/** A fresh project with a stable id (never a content hash) at the given display order. */
export const newProject = (order = 0): Project => ({ id: newId(), title: '', images: [], order });
