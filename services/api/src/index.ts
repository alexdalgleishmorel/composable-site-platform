/**
 * @csp/api — Lambda handlers behind the API Gateway HTTP API.
 *
 * Content CRUD (`GET`/`PUT /content`) lands in #13, the Cognito JWT authorizer in #14, presigned
 * uploads in #15, and the (deferred) Stripe checkout + webhook in #16. The handlers validate against
 * the shared registry in `@csp/blocks`. Stubbed for now.
 */
export const API_PACKAGE = '@csp/api';
