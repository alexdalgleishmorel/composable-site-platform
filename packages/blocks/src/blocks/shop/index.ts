import type { BlockType } from '../../contract';
import { ShopEditForm } from './EditForm';
import { shopDefault, shopSchema, validateShop, type ShopData } from './schema';

export const shop: BlockType<ShopData> = {
  type: 'shop',
  label: 'Shop',
  schema: shopSchema,
  EditForm: ShopEditForm,
  defaultData: shopDefault,
  validate: validateShop,
};

export { shopSchema, shopDefault, validateShop, shopItemSchema } from './schema';
export type { ShopData, ShopItem } from './schema';
