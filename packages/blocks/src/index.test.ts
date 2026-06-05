import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BlockRegistry, createRegistry, type BlockType } from './index';

// A throwaway block type used to exercise the contract before the real MVP blocks land.
const fake: BlockType<{ text: string }> = {
  type: 'fake',
  label: 'Fake',
  schema: z.object({ text: z.string() }),
  // EditForm is irrelevant to these tests; a no-op component satisfies the contract.
  EditForm: () => null,
  defaultData: () => ({ text: '' }),
};

describe('BlockRegistry', () => {
  it('registers and retrieves a block type by its join key', () => {
    const registry = createRegistry(fake);
    expect(registry.has('fake')).toBe(true);
    expect(registry.require('fake').label).toBe('Fake');
    expect(registry.types()).toEqual(['fake']);
  });

  it('rejects duplicate registration of the same type', () => {
    const registry = new BlockRegistry();
    registry.register(fake);
    expect(() => registry.register(fake)).toThrow(/already registered/);
  });

  it('throws on require() for an unknown type', () => {
    expect(() => new BlockRegistry().require('nope')).toThrow(/Unknown block type/);
  });

  it('projects to React-free validators', () => {
    const validators = createRegistry(fake).toValidators();
    expect(Object.keys(validators.schemas)).toEqual(['fake']);
  });
});
