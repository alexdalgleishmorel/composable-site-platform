import type { EditFormComponent } from '../../contract';
import { ListEditor, TextAreaField, TextField } from '../../ui/fields';
import { newShopNote, type ShopNote, type ShopNotesData } from './schema';

export const ShopNotesEditForm: EditFormComponent<ShopNotesData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <ListEditor<ShopNote>
      items={data.notes}
      create={newShopNote}
      addLabel="note"
      onChange={(notes) => onChange({ ...data, notes })}
      renderRow={(note, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Heading"
            value={note.heading}
            placeholder="e.g. Shipping"
            onChange={(heading) => update({ heading })}
          />
          <TextAreaField
            label="Body"
            value={note.body}
            placeholder="Note text"
            onChange={(body) => update({ body })}
          />
        </div>
      )}
    />
  </div>
);
