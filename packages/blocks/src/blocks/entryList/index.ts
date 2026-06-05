import type { BlockType } from '../../contract';
import { EntryListEditForm } from './EditForm';
import { entryListDefault, entryListSchema, type EntryListData } from './schema';

export const entryList: BlockType<EntryListData> = {
  type: 'entryList',
  label: 'Entry list (CV / timeline)',
  schema: entryListSchema,
  EditForm: EntryListEditForm,
  defaultData: entryListDefault,
};

export { entryListSchema, entryListDefault, entrySchema } from './schema';
export type { EntryListData, Entry } from './schema';
