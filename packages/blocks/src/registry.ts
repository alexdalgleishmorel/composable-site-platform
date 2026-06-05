/* eslint-disable @typescript-eslint/no-explicit-any -- `BlockType<T>` is invariant in T (T appears
   in both schema/EditForm input and output positions), so a heterogeneous registry must erase T to
   `any` internally — the TypeScript stand-in for an existential type. The public methods re-expose
   block types as `BlockType<unknown>`, keeping callers honest. */
import type { z } from 'zod';
import type { BlockType } from './contract';
import type { ContentValidators } from './validate';

type AnyBlockType = BlockType<any>;

/**
 * The block registry. Adding a block type = registering one module here — the backend, admin shell,
 * and API never change (§3, "the registry grows; the architecture doesn't").
 */
export class BlockRegistry {
  #map = new Map<string, AnyBlockType>();

  register<T>(block: BlockType<T>): this {
    if (this.#map.has(block.type)) {
      throw new Error(`Block type "${block.type}" is already registered`);
    }
    this.#map.set(block.type, block);
    return this;
  }

  has(type: string): boolean {
    return this.#map.has(type);
  }

  get(type: string): BlockType<unknown> | undefined {
    return this.#map.get(type);
  }

  /** Like `get`, but throws for an unknown type. */
  require(type: string): BlockType<unknown> {
    const block = this.#map.get(type);
    if (!block) throw new Error(`Unknown block type "${type}"`);
    return block;
  }

  types(): string[] {
    return [...this.#map.keys()];
  }

  list(): BlockType<unknown>[] {
    return [...this.#map.values()];
  }

  /** Extract the React-free validators the backend uses (see `validateContent`). */
  toValidators(): ContentValidators {
    const schemas: Record<string, z.ZodType> = {};
    const validators: Record<string, (data: unknown) => void> = {};
    for (const [type, block] of this.#map) {
      schemas[type] = block.schema;
      if (block.validate) validators[type] = block.validate;
    }
    return { schemas, validators };
  }
}

/** Build a registry from a list of block types. */
export function createRegistry(...blocks: AnyBlockType[]): BlockRegistry {
  const registry = new BlockRegistry();
  for (const block of blocks) registry.register(block);
  return registry;
}
