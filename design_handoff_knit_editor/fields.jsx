// fields.jsx — Knit reusable form fields (glass).
// Exports: Field, TextField, TextArea, NumberField, Toggle, ImageUpload, RepeatableList, IconBtn
const { useState, useRef, useCallback } = React;

/* tiny icon button used across cards/fields */
function IconBtn({ title, onClick, disabled, danger, children, size = 30 }) {
  return (
    <button
      type="button"
      className={"iconbtn focusable" + (danger ? " iconbtn--danger" : "")}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}

const I = {
  up: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>,
  down: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>,
  x: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  grip: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  img: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>,
};

/* ---- field shell: label + optional hint ---- */
function Field({ label, hint, htmlFor, children, error }) {
  return (
    <label className={"field" + (error ? " field--error" : "")} htmlFor={htmlFor}>
      {label && (
        <span className="field__label">
          {label}
          {hint && <span className="field__hint">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="field__err">{error}</span>}
    </label>
  );
}

function TextField({ label, hint, value, onChange, placeholder, mono, error, id }) {
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      <input
        id={id}
        className={"input focusable" + (mono ? " input--mono" : "")}
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function TextArea({ label, hint, value, onChange, placeholder, rows = 3, error, id }) {
  const ref = useRef(null);
  const autosize = useCallback((el) => {
    if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px";
  }, []);
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      <textarea
        id={id}
        ref={(el) => { ref.current = el; autosize(el); }}
        className="input input--area focusable"
        rows={rows}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); autosize(e.target); }}
      />
    </Field>
  );
}

function NumberField({ label, hint, value, onChange, min, max, step = 1, suffix, error, id }) {
  const set = (v) => {
    let n = v === "" ? "" : Number(v);
    if (typeof n === "number") { if (min != null) n = Math.max(min, n); if (max != null) n = Math.min(max, n); }
    onChange(n);
  };
  return (
    <Field label={label} hint={hint} htmlFor={id} error={error}>
      <div className="numberfield">
        <button type="button" className="numberfield__step focusable" onClick={() => set((Number(value) || 0) - step)} aria-label="Decrease">–</button>
        <input id={id} className="input input--number focusable" type="number" value={value ?? ""} min={min} max={max} step={step} onChange={(e) => set(e.target.value)} />
        {suffix && <span className="numberfield__suffix">{suffix}</span>}
        <button type="button" className="numberfield__step focusable" onClick={() => set((Number(value) || 0) + step)} aria-label="Increase">+</button>
      </div>
    </Field>
  );
}

function Toggle({ label, hint, value, onChange, id }) {
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <span className="field__label" style={{ marginBottom: 0 }}>{label}</span>
        {hint && <span className="toggle-row__hint">{hint}</span>}
      </div>
      <button
        type="button" role="switch" aria-checked={!!value} id={id}
        className={"switch focusable" + (value ? " switch--on" : "")}
        onClick={() => onChange(!value)}
      >
        <span className="switch__knob" />
      </button>
    </div>
  );
}

/* ---- image upload: drag-drop + button + thumbnail ---- */
function ImageUpload({ label, hint, value, onChange }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const f = files && files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onChange(url, f.name);
  };

  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="imgfield__filled">
          <div className="imgfield__thumb" style={{ backgroundImage: `url(${value})` }} />
          <div className="imgfield__meta">
            <span className="imgfield__name">Image attached</span>
            <div className="imgfield__actions">
              <button type="button" className="linkbtn focusable" onClick={() => inputRef.current?.click()}>Replace</button>
              <button type="button" className="linkbtn linkbtn--danger focusable" onClick={() => onChange("")}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={"dropzone focusable" + (drag ? " dropzone--over" : "")}
          tabIndex={0} role="button"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        >
          <span className="dropzone__icon">{I.img}</span>
          <span className="dropzone__main"><strong>Drop an image</strong> or click to browse</span>
          <span className="dropzone__sub">PNG, JPG, or WEBP · up to 10MB</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
    </Field>
  );
}

/* ---- repeatable list of rows with reorder + remove + add ---- */
function RepeatableList({ label, hint, items, onChange, renderRow, addLabel = "Add", makeItem, rowLabel }) {
  const remove = (i) => onChange(items.filter((_, k) => k !== i));
  const update = (i, val) => onChange(items.map((it, k) => (k === i ? val : it)));
  const add = () => onChange([...items, makeItem ? makeItem() : ""]);

  /* drag reorder */
  const dragI = useRef(null);
  const [overI, setOverI] = useState(null);
  const onDrop = (i) => {
    const from = dragI.current;
    if (from == null || from === i) { dragI.current = null; setOverI(null); return; }
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
    dragI.current = null; setOverI(null);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="repeat">
        {items.map((it, i) => (
          <div
            key={i}
            className={"repeat__row" + (overI === i ? " repeat__row--over" : "")}
            onDragOver={(e) => { e.preventDefault(); setOverI(i); }}
            onDrop={() => onDrop(i)}
          >
            <div
              className="repeat__grip focusable"
              draggable
              onDragStart={() => { dragI.current = i; }}
              onDragEnd={() => { dragI.current = null; setOverI(null); }}
              title="Drag to reorder"
            >
              {I.grip}
            </div>
            <div className="repeat__content">
              {rowLabel && <div className="repeat__rowlabel">{rowLabel(it, i)}</div>}
              {renderRow(it, (val) => update(i, val), i)}
            </div>
            <div className="repeat__controls">
              <IconBtn title="Remove" danger onClick={() => remove(i)} size={28}>{I.x}</IconBtn>
            </div>
          </div>
        ))}
        <button type="button" className="addrow focusable" onClick={add}>
          <span className="addrow__plus">{I.plus}</span>{addLabel}
        </button>
      </div>
    </Field>
  );
}

Object.assign(window, { Field, TextField, TextArea, NumberField, Toggle, ImageUpload, RepeatableList, IconBtn, FieldIcons: I });
