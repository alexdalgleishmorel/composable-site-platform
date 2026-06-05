/**
 * @csp/blocks/schemas — the React-free surface for the backend.
 *
 * `@csp/api` imports from here (and `./validate`) to validate content WITHOUT pulling EditForms — and
 * therefore React — into the Lambda bundle. As MVP block modules land (#6-#11) their React-free
 * schema + validator are re-exported here and assembled into `contentValidators`.
 */
import type { ContentValidators } from './validate';

export { validateContent } from './validate';
export type { ContentValidators, ContentIssue, ValidateResult } from './validate';

/** Block `type` -> data schema, assembled from each block's schema module (populated in #6-#11). */
export const contentValidators: ContentValidators = {
  schemas: {},
  validators: {},
};
