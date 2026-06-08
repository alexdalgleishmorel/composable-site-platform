import type { EditFormComponent } from '../../contract';
import { ListEditor, TextField } from '../../ui/fields';
import { newLink, type Link, type LinkListData } from './schema';

export const LinkListEditForm: EditFormComponent<LinkListData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <TextField
      label="Heading"
      value={data.heading}
      placeholder="e.g. elsewhere"
      onChange={(heading) => onChange({ ...data, heading: heading || undefined })}
    />
    <ListEditor<Link>
      items={data.links}
      create={newLink}
      addLabel="link"
      onChange={(links) => onChange({ ...data, links })}
      renderRow={(link, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Label"
            value={link.label}
            placeholder="GitHub"
            onChange={(label) => update({ label })}
          />
          <TextField
            label="URL"
            value={link.url}
            placeholder="https://…"
            onChange={(url) => update({ url })}
          />
        </div>
      )}
    />
  </div>
);
