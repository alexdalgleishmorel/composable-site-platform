import { render, type RenderResult } from '@testing-library/react';
import { useState } from 'react';
import type { EditFormComponent } from '../contract';

/**
 * Render an EditForm as a controlled component and expose the latest `data` it has emitted via
 * `onChange`. Shared by every block's EditForm test so they can drive inputs and assert the data
 * the block would persist.
 */
export function renderEditForm<T>(
  Form: EditFormComponent<T>,
  initial: T,
): RenderResult & { data: () => T } {
  const state = { current: initial };
  function Harness() {
    const [data, setData] = useState<T>(initial);
    state.current = data;
    return <Form data={data} onChange={setData} />;
  }
  const utils = render(<Harness />);
  return { ...utils, data: () => state.current };
}
