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
import { entryList } from './blocks/entryList';
import { noteCards } from './blocks/noteCards';
import { projectGrid } from './blocks/projectGrid';
import { richText } from './blocks/richText';
import { shop } from './blocks/shop';
import { shopNotes } from './blocks/shopNotes';
import { BlockRegistry } from './registry';

export * from './contract';
export * from './registry';
export * from './validate';

// Image upload for EditForms — the admin injects the transport (presign + S3 PUT, #15/#20).
export {
  UploaderProvider,
  useUploader,
  UploadButton,
  ImageField,
  ImageListField,
  type Uploader,
} from './ui/upload';

export { richText, projectGrid, shop, entryList, noteCards, shopNotes };
export type { RichTextData } from './blocks/richText';
export type { ProjectGridData, Project } from './blocks/projectGrid';
export type { ShopData, ShopItem } from './blocks/shop';
export type { EntryListData, Entry } from './blocks/entryList';
export type { NoteCardsData, NoteCard } from './blocks/noteCards';
export type { ShopNotesData, ShopNote } from './blocks/shopNotes';

export const BLOCKS_PACKAGE = '@csp/blocks';

/** The shared registry, assembled from the MVP block modules (#6-#11). */
export const registry = new BlockRegistry()
  .register(richText)
  .register(projectGrid)
  .register(shop)
  .register(entryList)
  .register(noteCards)
  .register(shopNotes);
