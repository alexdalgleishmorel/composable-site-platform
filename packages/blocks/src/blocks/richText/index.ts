import type { BlockType } from '../../contract';
import { RichTextEditForm } from './EditForm';
import { richTextDefault, richTextSchema, type RichTextData } from './schema';

export const richText: BlockType<RichTextData> = {
  type: 'richText',
  label: 'Rich text',
  schema: richTextSchema,
  EditForm: RichTextEditForm,
  defaultData: richTextDefault,
};

export { richTextSchema, richTextDefault };
export type { RichTextData };
