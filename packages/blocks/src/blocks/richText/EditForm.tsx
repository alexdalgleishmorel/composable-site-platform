import type { StyledText } from '../../text';
import type { EditFormComponent } from '../../contract';
import { ListEditor, StyledTextAreaField, TextField } from '../../ui/fields';
import { ImageField } from '../../ui/upload';
import type { RichTextData } from './schema';

export const RichTextEditForm: EditFormComponent<RichTextData> = ({ data, onChange }) => {
  // `ListEditor`'s built-in per-row `update` spreads `{...item, ...patch}`, which corrupts a bare
  // string item (spreads its characters as object keys) — paragraphs are a string | object union, so
  // rows replace themselves wholesale via `index` instead of using that merge.
  const setParagraph = (index: number, value: StyledText) =>
    onChange({ ...data, paragraphs: data.paragraphs.map((p, i) => (i === index ? value : p)) });

  return (
    <div className="csp-block-form">
      <TextField
        label="Heading"
        value={data.heading}
        placeholder="Optional heading"
        onChange={(heading) => onChange({ ...data, heading: heading || undefined })}
      />
      <ListEditor<StyledText>
        items={data.paragraphs}
        create={() => ''}
        addLabel="paragraph"
        onChange={(paragraphs) => onChange({ ...data, paragraphs })}
        renderRow={(paragraph, _update, index) => (
          <StyledTextAreaField
            label="Paragraph"
            value={paragraph}
            placeholder="A paragraph of text"
            onChange={(value) => setParagraph(index, value)}
          />
        )}
      />
      <ImageField
        label="Image URL"
        value={data.image}
        placeholder="https://cdn…/image.jpg"
        onChange={(image) => onChange({ ...data, image: image || undefined })}
      />
    </div>
  );
};
