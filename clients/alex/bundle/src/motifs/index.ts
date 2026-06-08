import type { BuiltinMotifKey } from '@csp/blocks';
import type { ComponentType } from 'react';
import { AverageCost } from './AverageCost';
import { Bars } from './Bars';
import { ExpenseVisualizer } from './ExpenseVisualizer';
import { FlowReport } from './FlowReport';
import { Mortgage } from './Mortgage';
import { PokerFlow } from './PokerFlow';
import { Pulse } from './Pulse';
import { Rings } from './Rings';
import { Wave } from './Wave';

export interface MotifProps {
  accent: string;
  accent2: string;
}

/**
 * The bundle's built-in CSS-motif registry, keyed by the shared `BuiltinMotifKey`. The keys MUST stay
 * in sync with `builtinMotifKeys` in `@csp/blocks` — guarded by `motifs.test.ts`. A project may also
 * use an uploaded Lottie animation instead of one of these (see `Animation`).
 */
export const motifs: Record<BuiltinMotifKey, ComponentType<MotifProps>> = {
  wave: Wave,
  rings: Rings,
  bars: Bars,
  pulse: Pulse,
  mortgage: Mortgage,
  'flow-report': FlowReport,
  'average-cost': AverageCost,
  'poker-flow': PokerFlow,
  'expense-visualizer': ExpenseVisualizer,
};
