import type { EditFormComponent } from '../../contract';
import { CheckboxField, ListEditor, NumberField, TextAreaField, TextField } from '../../ui/fields';
import { ImageListField } from '../../ui/upload';
import { newShopItem, type ShopData, type ShopItem } from './schema';

const reindex = (items: ShopItem[]): ShopItem[] => items.map((it, i) => ({ ...it, order: i }));

export const ShopEditForm: EditFormComponent<ShopData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <CheckboxField
      label="Shop enabled (visible in nav)"
      checked={data.enabled}
      onChange={(enabled) => onChange({ ...data, enabled })}
    />
    <TextField
      label="Currency (ISO code)"
      value={data.currency}
      placeholder="USD"
      onChange={(currency) => onChange({ ...data, currency: currency.toUpperCase() })}
    />
    <ListEditor<ShopItem>
      items={data.items}
      create={() => newShopItem(data.items.length)}
      addLabel="item"
      onChange={(items) => onChange({ ...data, items: reindex(items) })}
      renderRow={(item, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Name"
            value={item.name}
            placeholder="Item name"
            onChange={(name) => update({ name })}
          />
          <TextAreaField
            label="Description"
            value={item.description}
            placeholder="Optional description"
            onChange={(description) => update({ description: description || undefined })}
          />
          {/* Price is edited in major units but stored as integer cents. */}
          <NumberField
            label={`Price (${data.currency})`}
            value={item.priceCents / 100}
            min={0}
            step={0.01}
            placeholder="0.00"
            onChange={(major) => update({ priceCents: Math.round((major || 0) * 100) })}
          />
          <CheckboxField
            label="In stock"
            checked={item.inStock}
            onChange={(inStock) => update({ inStock })}
          />
          <ImageListField
            label="Image URLs"
            values={item.images}
            addLabel="image"
            placeholder="https://cdn…/image.jpg"
            onChange={(images) => update({ images })}
          />
          {/* Stripe ids are synced by the backend (#16) — shown read-only. */}
          <label className="csp-field">
            <span className="csp-field__label">Stripe</span>
            <input
              className="csp-input csp-input--readonly"
              readOnly
              value={
                item.stripeProductId
                  ? `${item.stripeProductId} / ${item.stripePriceId ?? '—'}`
                  : '— synced by Stripe —'
              }
            />
          </label>
        </div>
      )}
    />
  </div>
);
