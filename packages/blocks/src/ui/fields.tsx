import type { ReactNode } from 'react';

/**
 * Shared EditForm primitives. Every block's EditForm is built from these, so the admin app gets a
 * consistent editing UI for free and blocks stay DRY. They are deliberately unstyled beyond stable
 * `csp-*` class hooks — the admin shell (#18) owns the CSS; the look here is irrelevant since clients
 * never design post-creation (§7).
 */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="csp-field">
      <span className="csp-field__label">{label}</span>
      {children}
    </label>
  );
}

export function TextField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={props.label}>
      <input
        className="csp-input"
        type="text"
        value={props.value ?? ''}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextAreaField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={props.label}>
      <textarea
        className="csp-input csp-input--multiline"
        rows={props.rows ?? 3}
        value={props.value ?? ''}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  );
}

export function NumberField(props: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <Field label={props.label}>
      <input
        className="csp-input"
        type="number"
        value={props.value ?? ''}
        min={props.min}
        step={props.step}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.valueAsNumber)}
      />
    </Field>
  );
}

export function CheckboxField(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="csp-field csp-field--inline">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="csp-field__label">{props.label}</span>
    </label>
  );
}

/**
 * Up / down / delete controls for one row of a list. `label` names the item ("project", "image", …)
 * so tooltips are clear and — importantly — distinct across nested lists (a project row contains its
 * own image and tag lists).
 */
export function RowControls(props: {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const { index, count, label, onMove, onRemove } = props;
  return (
    <div className="csp-row-controls">
      <button
        type="button"
        className="csp-btn csp-btn--icon"
        title={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="csp-btn csp-btn--icon"
        title={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
      <button
        type="button"
        className="csp-btn csp-btn--icon csp-btn--danger"
        title={`Remove ${label}`}
        onClick={() => onRemove(index)}
      >
        ×
      </button>
    </div>
  );
}

/** Move an array element from one index to another, returning a new array. */
export function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/**
 * A generic list editor: add / remove / reorder rows of `T`, with each row rendered by `renderRow`.
 * `onChange` receives the whole next array. Used by paragraphs, projects, shop items, CV entries,
 * note cards, and shop notes.
 */
export function ListEditor<T>(props: {
  items: T[];
  onChange: (next: T[]) => void;
  create: () => T;
  addLabel: string;
  renderRow: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const { items, onChange, create, addLabel, renderRow } = props;
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const reorder = (from: number, to: number) => onChange(move(items, from, to));

  return (
    <div className="csp-list">
      {items.map((item, index) => (
        <div className="csp-list__row" key={index}>
          <div className="csp-list__body">
            {renderRow(item, (patch) => update(index, patch), index)}
          </div>
          <RowControls
            index={index}
            count={items.length}
            label={addLabel}
            onMove={reorder}
            onRemove={remove}
          />
        </div>
      ))}
      <button
        type="button"
        className="csp-btn csp-btn--add"
        onClick={() => onChange([...items, create()])}
      >
        + {addLabel}
      </button>
    </div>
  );
}

/**
 * A colour field: a native swatch picker bound to a hex text input. Both edit the same `#rrggbb`
 * value, so a user can pick visually or paste a brand hex. The swatch falls back to black while the
 * text is mid-edit / not yet a valid hex (a `<input type="color">` can't display a partial value).
 */
export function ColorField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const value = props.value ?? '';
  const isHex = /^#([0-9a-fA-F]{6})$/.test(value);
  return (
    <Field label={props.label}>
      <span className="csp-color-field">
        <input
          className="csp-color-field__swatch"
          type="color"
          aria-label={`${props.label} colour picker`}
          value={isHex ? value : '#000000'}
          onChange={(e) => props.onChange(e.target.value)}
        />
        <input
          className="csp-input csp-color-field__hex"
          type="text"
          value={value}
          placeholder={props.placeholder ?? '#000000'}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </span>
    </Field>
  );
}

/** An option for `SelectField` — a bare value (label === value) or an explicit `{ value, label }`. */
export type SelectOption = string | { value: string; label: string };

/** A labelled `<select>`. `placeholder`, when set, renders a disabled empty first option. */
export function SelectField(props: {
  label: string;
  value: string | undefined;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const opts = props.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <Field label={props.label}>
      <select
        className="csp-input csp-select"
        value={props.value ?? ''}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.placeholder !== undefined && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A list editor specialised for `string[]` (e.g. richText paragraphs). */
export function StringListField(props: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const { label, values, onChange, addLabel, multiline, placeholder } = props;
  const update = (index: number, value: string) =>
    onChange(values.map((v, i) => (i === index ? value : v)));
  return (
    <Field label={label}>
      <div className="csp-list">
        {values.map((value, index) => (
          <div className="csp-list__row" key={index}>
            {multiline ? (
              <textarea
                className="csp-input csp-input--multiline csp-list__body"
                rows={3}
                value={value}
                placeholder={placeholder}
                onChange={(e) => update(index, e.target.value)}
              />
            ) : (
              <input
                className="csp-input csp-list__body"
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => update(index, e.target.value)}
              />
            )}
            <RowControls
              index={index}
              count={values.length}
              label={addLabel}
              onMove={(from, to) => onChange(move(values, from, to))}
              onRemove={(i) => onChange(values.filter((_, j) => j !== i))}
            />
          </div>
        ))}
        <button
          type="button"
          className="csp-btn csp-btn--add"
          onClick={() => onChange([...values, ''])}
        >
          + {addLabel}
        </button>
      </div>
    </Field>
  );
}
