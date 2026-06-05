import type { EditFormComponent } from '../../contract';
import { StringListField, TextField } from '../../ui/fields';
import type { RichTextData } from './schema';

export const RichTextEditForm: EditFormComponent<RichTextData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <TextField
      label="Heading"
      value={data.heading}
      placeholder="Optional heading"
      onChange={(heading) => onChange({ ...data, heading: heading || undefined })}
    />
    <StringListField
      label="Paragraphs"
      values={data.paragraphs}
      addLabel="paragraph"
      multiline
      placeholder="A paragraph of text"
      onChange={(paragraphs) => onChange({ ...data, paragraphs })}
    />
    <TextField
      label="Image URL"
      value={data.image}
      placeholder="https://cdn…/image.jpg"
      onChange={(image) => onChange({ ...data, image: image || undefined })}
    />
  </div>
);
