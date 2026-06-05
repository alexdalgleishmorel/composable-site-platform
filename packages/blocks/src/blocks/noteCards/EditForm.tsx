import type { EditFormComponent } from '../../contract';
import { ListEditor, TextAreaField, TextField } from '../../ui/fields';
import { newNoteCard, type NoteCard, type NoteCardsData } from './schema';

export const NoteCardsEditForm: EditFormComponent<NoteCardsData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <TextField
      label="Heading"
      value={data.heading}
      placeholder="e.g. currently"
      onChange={(heading) => onChange({ ...data, heading: heading || undefined })}
    />
    <ListEditor<NoteCard>
      items={data.cards}
      create={newNoteCard}
      addLabel="card"
      onChange={(cards) => onChange({ ...data, cards })}
      renderRow={(card, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Label"
            value={card.label}
            placeholder="e.g. making"
            onChange={(label) => update({ label })}
          />
          <TextAreaField
            label="Body"
            value={card.body}
            placeholder="Card text"
            onChange={(body) => update({ body })}
          />
        </div>
      )}
    />
  </div>
);
