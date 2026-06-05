import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount the rendered tree after every test so successive EditForm renders don't leak into the DOM.
afterEach(() => cleanup());
