/**
 * @csp/blocks — the shared block registry.
 *
 * The `BlockType<T>` contract (`type`, `schema`, `EditForm`, optional per-type validator) and the
 * `register()` API land in issue #5; the MVP block modules (richText, projectGrid, shop, entryList,
 * noteCards, shopNotes) follow in #6-#11. This stub imports from `@csp/core` to verify cross-package
 * resolution across the workspace.
 */
import { CORE_PACKAGE } from '@csp/core';

export const BLOCKS_PACKAGE = '@csp/blocks';

/** Proves the workspace dependency on `@csp/core` resolves at type- and run-time. */
export const DEPENDS_ON = CORE_PACKAGE;
