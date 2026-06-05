import type { EditFormComponent } from '../../contract';
import { ListEditor, StringListField, TextAreaField, TextField } from '../../ui/fields';
import { newProject, type Project, type ProjectGridData } from './schema';

/** Keep each project's `order` in sync with its position after add/remove/reorder. */
const reindex = (projects: Project[]): Project[] => projects.map((p, i) => ({ ...p, order: i }));

export const ProjectGridEditForm: EditFormComponent<ProjectGridData> = ({ data, onChange }) => (
  <div className="csp-block-form">
    <ListEditor<Project>
      items={data.projects}
      create={() => newProject(data.projects.length)}
      addLabel="project"
      onChange={(projects) => onChange({ ...data, projects: reindex(projects) })}
      renderRow={(project, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Title"
            value={project.title}
            placeholder="Project title"
            onChange={(title) => update({ title })}
          />
          <TextField
            label="Summary"
            value={project.summary}
            placeholder="Short card text"
            onChange={(summary) => update({ summary: summary || undefined })}
          />
          <TextAreaField
            label="Body"
            value={project.body}
            placeholder="Full description"
            onChange={(body) => update({ body: body || undefined })}
          />
          <StringListField
            label="Image URLs"
            values={project.images}
            addLabel="image"
            placeholder="https://cdn…/image.jpg"
            onChange={(images) => update({ images })}
          />
          <TextField
            label="External link"
            value={project.link}
            placeholder="https://…"
            onChange={(link) => update({ link: link || undefined })}
          />
          <StringListField
            label="Tags"
            values={project.tags ?? []}
            addLabel="tag"
            placeholder="tag"
            onChange={(tags) => update({ tags: tags.length ? tags : undefined })}
          />
        </div>
      )}
    />
  </div>
);
