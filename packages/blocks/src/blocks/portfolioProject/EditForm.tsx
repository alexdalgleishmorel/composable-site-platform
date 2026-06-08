import type { EditFormComponent } from '../../contract';
import { ColorField, ListEditor, SelectField, TextAreaField, TextField } from '../../ui/fields';
import { AnimationField } from '../../ui/upload';
import {
  builtinMotifKeys,
  newPortfolioProject,
  type BuiltinMotifKey,
  type PortfolioProject,
  type PortfolioProjectsData,
} from './schema';

/** Keep each project's `order` in sync with its position after add/remove/reorder. */
const reindex = (projects: PortfolioProject[]): PortfolioProject[] =>
  projects.map((p, i) => ({ ...p, order: i }));

export const PortfolioProjectEditForm: EditFormComponent<PortfolioProjectsData> = ({
  data,
  onChange,
}) => (
  <div className="csp-block-form">
    <ListEditor<PortfolioProject>
      items={data.projects}
      create={() => newPortfolioProject(data.projects.length)}
      addLabel="project"
      onChange={(projects) => onChange({ ...data, projects: reindex(projects) })}
      renderRow={(project, update) => (
        <div className="csp-block-form__row">
          <TextField
            label="Name"
            value={project.name}
            placeholder="Project name"
            onChange={(name) => update({ name })}
          />
          <TextField
            label="Headline"
            value={project.headline}
            placeholder="One-line tagline"
            onChange={(headline) => update({ headline })}
          />
          <TextAreaField
            label="Description"
            value={project.description}
            placeholder="Full description"
            onChange={(description) => update({ description })}
          />
          <TextField
            label="GitHub link"
            value={project.links.github}
            placeholder="https://github.com/…"
            onChange={(github) =>
              update({ links: { ...project.links, github: github || undefined } })
            }
          />
          <TextField
            label="Demo link"
            value={project.links.demo}
            placeholder="https://… (demo video)"
            onChange={(demo) => update({ links: { ...project.links, demo: demo || undefined } })}
          />
          <TextField
            label="Try-it link"
            value={project.links.try}
            placeholder="https://… (live app)"
            onChange={(tryUrl) => update({ links: { ...project.links, try: tryUrl || undefined } })}
          />
          <ColorField
            label="Accent"
            value={project.accent}
            onChange={(accent) => update({ accent })}
          />
          <ColorField
            label="Accent 2"
            value={project.accent2}
            onChange={(accent2) => update({ accent2 })}
          />
          <SelectField
            label="Animation source"
            value={project.animation.kind}
            options={[
              { value: 'builtin', label: 'Built-in motif' },
              { value: 'lottie', label: 'Uploaded animation (Lottie)' },
            ]}
            onChange={(kind) =>
              update({
                animation:
                  kind === 'lottie'
                    ? {
                        kind: 'lottie',
                        url: project.animation.kind === 'lottie' ? project.animation.url : '',
                      }
                    : {
                        kind: 'builtin',
                        key: project.animation.kind === 'builtin' ? project.animation.key : 'pulse',
                      },
              })
            }
          />
          {project.animation.kind === 'builtin' ? (
            <SelectField
              label="Motif"
              value={project.animation.key}
              options={builtinMotifKeys}
              onChange={(key) =>
                update({ animation: { kind: 'builtin', key: key as BuiltinMotifKey } })
              }
            />
          ) : (
            <AnimationField
              label="Lottie animation"
              value={project.animation.url}
              onChange={(url) => update({ animation: { kind: 'lottie', url } })}
            />
          )}
        </div>
      )}
    />
  </div>
);
