import type { BlockType } from '../../contract';
import { ProjectGridEditForm } from './EditForm';
import { projectGridDefault, projectGridSchema, type ProjectGridData } from './schema';

export const projectGrid: BlockType<ProjectGridData> = {
  type: 'projectGrid',
  label: 'Project grid',
  schema: projectGridSchema,
  EditForm: ProjectGridEditForm,
  defaultData: projectGridDefault,
};

export { projectGridSchema, projectGridDefault, projectSchema } from './schema';
export type { ProjectGridData, Project } from './schema';
