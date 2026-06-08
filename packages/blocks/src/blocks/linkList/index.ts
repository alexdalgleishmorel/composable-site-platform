import type { BlockType } from '../../contract';
import { LinkListEditForm } from './EditForm';
import { linkListDefault, linkListSchema, type LinkListData } from './schema';

export const linkList: BlockType<LinkListData> = {
  type: 'linkList',
  label: 'Link list',
  schema: linkListSchema,
  EditForm: LinkListEditForm,
  defaultData: linkListDefault,
};

export { linkListSchema, linkListDefault, linkSchema, newLink } from './schema';
export type { LinkListData, Link } from './schema';
