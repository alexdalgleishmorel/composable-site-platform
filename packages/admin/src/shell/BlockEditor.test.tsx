import { registry } from '@csp/blocks';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfirmProvider } from '../confirm';
import { BlockEditor } from './BlockEditor';

const noop = () => {};

function renderEditor(allowedTypes: string[] | null) {
  return render(
    <ConfirmProvider>
      <BlockEditor
        pageTitle="Home"
        blocks={[]}
        registry={registry}
        allowedTypes={allowedTypes}
        justAddedId={null}
        onPatchBlock={noop}
        onRemoveBlock={noop}
        onReorder={noop}
        onAddBlock={noop}
      />
    </ConfirmProvider>,
  );
}

describe('BlockEditor "Add a block" provisioning filter', () => {
  it('shows every registered block type when allowedTypes is null', () => {
    renderEditor(null);
    expect(screen.getByRole('button', { name: 'Add Rich text block' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Shop block' })).toBeTruthy();
  });

  it('shows only the provisioned types when restricted', () => {
    renderEditor(['richText']);
    expect(screen.getByRole('button', { name: 'Add Rich text block' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add Shop block' })).toBeNull();
  });
});
