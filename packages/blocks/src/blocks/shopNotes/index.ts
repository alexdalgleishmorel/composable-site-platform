import type { BlockType } from '../../contract';
import { ShopNotesEditForm } from './EditForm';
import { shopNotesDefault, shopNotesSchema, type ShopNotesData } from './schema';

export const shopNotes: BlockType<ShopNotesData> = {
  type: 'shopNotes',
  label: 'Shop notes',
  schema: shopNotesSchema,
  EditForm: ShopNotesEditForm,
  defaultData: shopNotesDefault,
};

export { shopNotesSchema, shopNotesDefault, shopNoteSchema } from './schema';
export type { ShopNotesData, ShopNote } from './schema';
