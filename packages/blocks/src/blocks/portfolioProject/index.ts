import type { BlockType } from '../../contract';
import { PortfolioProjectEditForm } from './EditForm';
import {
  portfolioProjectsDefault,
  portfolioProjectsSchema,
  type PortfolioProjectsData,
} from './schema';

export const portfolioProject: BlockType<PortfolioProjectsData> = {
  type: 'portfolioProject',
  label: 'Portfolio projects',
  schema: portfolioProjectsSchema,
  EditForm: PortfolioProjectEditForm,
  defaultData: portfolioProjectsDefault,
};

export {
  portfolioProjectsSchema,
  portfolioProjectsDefault,
  portfolioProjectSchema,
  animationSchema,
  builtinMotifKeys,
  newPortfolioProject,
} from './schema';
export type {
  PortfolioProjectsData,
  PortfolioProject,
  PortfolioLinks,
  Animation,
  BuiltinMotifKey,
} from './schema';
