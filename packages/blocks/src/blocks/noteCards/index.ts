import type { BlockType } from '../../contract';
import { NoteCardsEditForm } from './EditForm';
import { noteCardsDefault, noteCardsSchema, type NoteCardsData } from './schema';

export const noteCards: BlockType<NoteCardsData> = {
  type: 'noteCards',
  label: 'Note cards',
  schema: noteCardsSchema,
  EditForm: NoteCardsEditForm,
  defaultData: noteCardsDefault,
};

export { noteCardsSchema, noteCardsDefault, noteCardSchema } from './schema';
export type { NoteCardsData, NoteCard } from './schema';
