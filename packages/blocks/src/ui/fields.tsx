import { useRef, useState, type ReactNode } from 'react';

/**
 * Shared EditForm primitives. Every block's EditForm is built from these, so the admin app gets a
 * consistent editing UI for free and blocks stay DRY. They are deliberately unstyled beyond stable
 * `csp-*` class hooks — the admin shell (#18) owns the CSS; the look here is irrelevant since clients
 * never design post-creation (§7).
 *
 * Reordering is **drag-only** (Knit redesign): every list row carries a drag grip instead of
 * up/down arrows. The grip is keyboard-operable (↑/↓ reorder) so the interaction stays accessible.
 */

/** The six-dot drag grip, used by every reorderable row. */
function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="csp-field">
      <span className="csp-field__label">
        {label}
        {hint && <span className="csp-field__hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Render the input in the monospace face (URLs, codes, paths). */
  mono?: boolean;
}) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        className={'csp-input' + (props.mono ? ' csp-input--mono' : '')}
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
  // Auto-grow to fit content so long paragraphs don't hide behind a scrollbar.
  const autosize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  return (
    <Field label={props.label}>
      <textarea
        className="csp-input csp-input--multiline"
        rows={props.rows ?? 3}
        ref={autosize}
        value={props.value ?? ''}
        placeholder={props.placeholder}
        onChange={(e) => {
          props.onChange(e.target.value);
          autosize(e.target);
        }}
      />
    </Field>
  );
}

export function NumberField(props: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** Optional unit shown after the input (e.g. a currency code). */
  suffix?: string;
}) {
  const step = props.step ?? 1;
  const clamp = (n: number) => {
    if (props.min != null) n = Math.max(props.min, n);
    if (props.max != null) n = Math.min(props.max, n);
    return n;
  };
  const nudge = (delta: number) => props.onChange(clamp((Number(props.value) || 0) + delta));
  return (
    <Field label={props.label}>
      <div className="csp-number">
        <button
          type="button"
          className="csp-number__step"
          aria-label={`Decrease ${props.label}`}
          onClick={() => nudge(-step)}
        >
          –
        </button>
        <input
          className="csp-input csp-input--number"
          type="number"
          value={props.value ?? ''}
          min={props.min}
          max={props.max}
          step={step}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.valueAsNumber)}
        />
        {props.suffix && <span className="csp-number__suffix">{props.suffix}</span>}
        <button
          type="button"
          className="csp-number__step"
          aria-label={`Increase ${props.label}`}
          onClick={() => nudge(step)}
        >
          +
        </button>
      </div>
    </Field>
  );
}

/**
 * A labelled on/off control rendered as a sliding switch. Keeps a real `<input type="checkbox">`
 * (wrapped by the `<label>`) so it stays keyboard- and screen-reader-native and `getByLabelText`
 * resolves it; the switch visuals are pure CSS on the adjacent track.
 */
export function CheckboxField(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="csp-toggle">
      <span className="csp-toggle__label">{props.label}</span>
      <span className="csp-switch">
        <input
          className="csp-switch__input"
          type="checkbox"
          role="switch"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        <span className="csp-switch__track">
          <span className="csp-switch__knob" />
        </span>
      </span>
    </label>
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

/** Drag-and-keyboard reorder state shared by `ListEditor` and `StringListField`. */
function useReorder<T>(items: T[], onChange: (next: T[]) => void) {
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    onChange(move(items, from, to));
  };
  const dropAt = (i: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragging(null);
    setOverIndex(null);
    if (from == null) return;
    reorder(from, i);
  };
  return { dragIndex, overIndex, setOverIndex, dragging, setDragging, reorder, dropAt };
}

/**
 * One reorderable row: a drag grip (also ↑/↓ keyboard), the row body, and a remove button. Shared so
 * `ListEditor` and `StringListField` reorder identically.
 */
function ReorderRow(props: {
  index: number;
  label: string;
  reorder: ReturnType<typeof useReorder>;
  onRemove: (index: number) => void;
  children: ReactNode;
}) {
  const { index, label, reorder, onRemove, children } = props;
  return (
    <div
      className={
        'csp-list__row' +
        (reorder.overIndex === index && reorder.dragging !== index ? ' csp-list__row--over' : '') +
        (reorder.dragging === index ? ' csp-list__row--dragging' : '')
      }
      onDragOver={(e) => {
        if (reorder.dragging == null) return;
        e.preventDefault();
        if (reorder.overIndex !== index) reorder.setOverIndex(index);
      }}
      onDrop={() => reorder.dropAt(index)}
    >
      <button
        type="button"
        className="csp-list__grip"
        draggable
        aria-label={`Reorder ${label}`}
        title={`Drag, or press the arrow keys, to reorder ${label}`}
        onDragStart={() => {
          reorder.dragIndex.current = index;
          reorder.setDragging(index);
        }}
        onDragEnd={() => {
          reorder.dragIndex.current = null;
          reorder.setDragging(null);
          reorder.setOverIndex(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            reorder.reorder(index, index - 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            reorder.reorder(index, index + 1);
          }
        }}
      >
        <GripIcon />
      </button>
      <div className="csp-list__body">{children}</div>
      <button
        type="button"
        className="csp-btn csp-btn--icon csp-btn--danger csp-list__remove"
        title={`Remove ${label}`}
        aria-label={`Remove ${label}`}
        onClick={() => onRemove(index)}
      >
        ×
      </button>
    </div>
  );
}

/**
 * A generic list editor: add / remove / drag-reorder rows of `T`, with each row rendered by
 * `renderRow`. `onChange` receives the whole next array. Used by paragraphs, projects, shop items,
 * CV entries, note cards, and shop notes.
 */
export function ListEditor<T>(props: {
  items: T[];
  onChange: (next: T[]) => void;
  create: () => T;
  addLabel: string;
  renderRow: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const { items, onChange, create, addLabel, renderRow } = props;
  const reorder = useReorder(items, onChange);
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="csp-list">
      {items.map((item, index) => (
        <ReorderRow key={index} index={index} label={addLabel} reorder={reorder} onRemove={remove}>
          {renderRow(item, (patch) => update(index, patch), index)}
        </ReorderRow>
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
  const reorder = useReorder(values, onChange);
  const update = (index: number, value: string) =>
    onChange(values.map((v, i) => (i === index ? value : v)));
  const remove = (index: number) => onChange(values.filter((_, i) => i !== index));

  return (
    <Field label={label}>
      <div className="csp-list">
        {values.map((value, index) => (
          <ReorderRow
            key={index}
            index={index}
            label={addLabel}
            reorder={reorder}
            onRemove={remove}
          >
            {multiline ? (
              <textarea
                className="csp-input csp-input--multiline"
                rows={3}
                value={value}
                placeholder={placeholder}
                onChange={(e) => update(index, e.target.value)}
              />
            ) : (
              <input
                className="csp-input"
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => update(index, e.target.value)}
              />
            )}
          </ReorderRow>
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
