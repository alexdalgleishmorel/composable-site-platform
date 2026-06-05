import { registry } from '@csp/blocks';
import { newId, type Block, type TenantContent } from '@csp/core';

function block(type: string, order: number): Block {
  return { id: newId(), type, order, data: registry.require(type).defaultData() };
}

/** A small, tenant-agnostic sample document for local dev — every tenant uses the same admin. */
export function sampleContent(): TenantContent {
  return {
    tenantId: 'demo.example',
    siteMeta: { siteName: 'Demo Site' },
    pages: [
      { id: newId(), slug: '/', title: 'Home', blocks: [block('projectGrid', 0)] },
      { id: newId(), slug: '/about', title: 'About', blocks: [block('richText', 0)] },
    ],
    updatedAt: '2026-06-05T00:00:00.000Z',
  };
}
