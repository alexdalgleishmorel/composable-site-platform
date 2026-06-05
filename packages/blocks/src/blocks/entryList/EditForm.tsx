import type { EditFormComponent } from '../../contract';
import { ListEditor, TextField } from '../../ui/fields';
import { newEntry, type Entry, type EntryListData } from './schema';

export const EntryListEditForm: EditFormComponent<EntryListData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <TextField
      label="Heading"
      value={data.heading}
      placeholder="e.g. selected works"
      onChange={(heading) => onChange({ ...data, heading: heading || undefined })}
    />
    <ListEditor<Entry>
      items={data.entries}
      create={newEntry}
      addLabel="entry"
      onChange={(entries) => onChange({ ...data, entries })}
      renderRow={(entry, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Year"
            value={entry.year}
            placeholder="2024"
            onChange={(year) => update({ year })}
          />
          <TextField
            label="Title"
            value={entry.title}
            placeholder="Entry title"
            onChange={(title) => update({ title })}
          />
          <TextField
            label="Subtitle"
            value={entry.subtitle}
            placeholder="Optional detail"
            onChange={(subtitle) => update({ subtitle: subtitle || undefined })}
          />
        </div>
      )}
    />
  </div>
);
