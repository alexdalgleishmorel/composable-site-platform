/**
 * @csp/blocks — the shared block registry.
 *
 * The default export `registry` is the full registry including EditForms (used by the admin app and,
 * for types only, by client bundles). The MVP block modules register here as they land (#6-#11):
 * richText, projectGrid, shop, entryList, noteCards, shopNotes.
 *
 * Backend code should import the React-free surface from `@csp/blocks/schemas` instead, to keep
 * React out of the Lambda bundle.
 */
import { projectGrid } from './blocks/projectGrid';
import { richText } from './blocks/richText';
import { BlockRegistry } from './registry';

export * from './contract';
export * from './registry';
export * from './validate';

export { richText, projectGrid };
export type { RichTextData } from './blocks/richText';
export type { ProjectGridData, Project } from './blocks/projectGrid';

export const BLOCKS_PACKAGE = '@csp/blocks';

/** The shared registry, assembled from the MVP block modules (#6-#11). */
export const registry = new BlockRegistry().register(richText).register(projectGrid);
