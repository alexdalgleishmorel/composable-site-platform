import { z } from 'zod';

/**
 * type: "linkList" — a small heading + a list of labelled external links. General-purpose (about-page
 * "elsewhere", press links, social, …); the data contract is shared, the render is per-client.
 */
export const linkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});
export type Link = z.infer<typeof linkSchema>;

export const linkListSchema = z.object({
  heading: z.string().optional(),
  links: z.array(linkSchema),
});
export type LinkListData = z.infer<typeof linkListSchema>;

export const linkListDefault = (): LinkListData => ({ links: [] });
export const newLink = (): Link => ({ label: '', url: '' });
