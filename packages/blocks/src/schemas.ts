/**
 * @csp/blocks/schemas — the React-free surface for the backend.
 *
 * `@csp/api` imports from here (and `./validate`) to validate content WITHOUT pulling EditForms — and
 * therefore React — into the Lambda bundle. As MVP block modules land (#6-#11) their React-free
 * schema + validator are re-exported here and assembled into `contentValidators`.
 */
import { entryListSchema } from './blocks/entryList/schema';
import { noteCardsSchema } from './blocks/noteCards/schema';
import { projectGridSchema } from './blocks/projectGrid/schema';
import { richTextSchema } from './blocks/richText/schema';
import { shopSchema, validateShop, type ShopData } from './blocks/shop/schema';
import { shopNotesSchema } from './blocks/shopNotes/schema';
import type { ContentValidators } from './validate';

export { validateContent } from './validate';
export type { ContentValidators, ContentIssue, ValidateResult } from './validate';

/** Block `type` -> data schema, assembled from each block's React-free schema module (#6-#11). */
export const contentValidators: ContentValidators = {
  schemas: {
    richText: richTextSchema,
    projectGrid: projectGridSchema,
    shop: shopSchema,
    entryList: entryListSchema,
    noteCards: noteCardsSchema,
    shopNotes: shopNotesSchema,
  },
  validators: {
    // Stricter money validation runs after the schema parse (real money — §5).
    shop: (data) => validateShop(data as ShopData),
  },
};
