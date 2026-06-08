import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Field, move, StringListField, TextField } from './fields';

/**
 * Image upload for EditForms. The transport is *injected* by the admin app (presign + S3 PUT, #15) so
 * the shared editing plane stays decoupled from a specific backend — and image bytes never route
 * through Lambda (§6). With no uploader in context, the fields degrade to manual URL entry.
 *
 * Visually (Knit redesign) an image is a **drag-and-drop dropzone** that's also click-to-browse;
 * once set it becomes a thumbnail with Replace / Remove.
 */
export type Uploader = (file: File) => Promise<string>;

const UploaderContext = createContext<Uploader | null>(null);

export function UploaderProvider({
  uploader,
  children,
}: {
  uploader: Uploader | null;
  children: ReactNode;
}) {
  return <UploaderContext.Provider value={uploader}>{children}</UploaderContext.Provider>;
}

export function useUploader(): Uploader | null {
  return useContext(UploaderContext);
}

/** Drive a hidden `<input type="file">` from imperative code (dropzone click / Replace). */
function useFilePicker(onFile: (file: File) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      className="csp-upload__input"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        if (ref.current) ref.current.value = '';
      }}
    />
  );
  return { input, open: () => ref.current?.click() };
}

/** The empty state: a drag-over-highlighting dropzone that's also click-to-browse. */
function Dropzone({
  onFile,
  open,
  busy,
  label = 'Drop an image',
}: {
  onFile: (file: File) => void;
  open: () => void;
  busy: boolean;
  label?: string;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={'csp-dropzone' + (over ? ' csp-dropzone--over' : '')}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      <span className="csp-dropzone__icon" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.6" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </span>
      <span className="csp-dropzone__main">
        <strong>{busy ? 'Uploading…' : label}</strong>
        {!busy && ' or click to browse'}
      </span>
      <span className="csp-dropzone__sub">PNG, JPG, or WEBP</span>
    </div>
  );
}

/** The filled state: thumbnail + Replace / Remove. */
function Thumb({
  url,
  onReplace,
  onRemove,
}: {
  url: string;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="csp-imgfield">
      <span className="csp-imgfield__thumb" style={{ backgroundImage: `url(${url})` }} />
      <div className="csp-imgfield__meta">
        <span className="csp-imgfield__name">Image attached</span>
        <div className="csp-imgfield__actions">
          <button type="button" className="csp-linkbtn" onClick={onReplace}>
            Replace
          </button>
          <button type="button" className="csp-linkbtn csp-linkbtn--danger" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/** Run a file through the injected uploader, tracking busy/error. */
function useUpload(uploader: Uploader, onUrl: (url: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      onUrl(await uploader(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

/** A single image: dropzone → upload → thumbnail. Falls back to a URL field with no uploader. */
export function ImageField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const uploader = useUploader();
  const { busy, error, upload } = useUpload(uploader ?? (async () => ''), props.onChange);
  const picker = useFilePicker(upload);

  if (!uploader) return <TextField {...props} />; // manual URL entry only

  return (
    <Field label={props.label}>
      {props.value ? (
        <Thumb url={props.value} onReplace={picker.open} onRemove={() => props.onChange('')} />
      ) : (
        <Dropzone onFile={upload} open={picker.open} busy={busy} />
      )}
      {error && <span className="csp-upload__error">{error}</span>}
      {picker.input}
    </Field>
  );
}

/** One row of an image list when an uploader is present: thumbnail/dropzone + drag grip + remove. */
function ImageRow(props: {
  uploader: Uploader;
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  reorder: {
    overIndex: number | null;
    dragging: number | null;
    index: number;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}) {
  const { busy, error, upload } = useUpload(props.uploader, props.onChange);
  const picker = useFilePicker(upload);
  const r = props.reorder;
  return (
    <div
      className={
        'csp-list__row' +
        (r.overIndex === r.index && r.dragging !== r.index ? ' csp-list__row--over' : '') +
        (r.dragging === r.index ? ' csp-list__row--dragging' : '')
      }
      onDragOver={r.onDragOver}
      onDrop={r.onDrop}
    >
      <button
        type="button"
        className="csp-list__grip"
        draggable
        aria-label="Reorder image"
        title="Drag, or press the arrow keys, to reorder image"
        onDragStart={r.onDragStart}
        onDragEnd={r.onDragEnd}
        onKeyDown={r.onKeyDown}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <div className="csp-list__body">
        {props.value ? (
          <Thumb url={props.value} onReplace={picker.open} onRemove={props.onRemove} />
        ) : (
          <Dropzone onFile={upload} open={picker.open} busy={busy} />
        )}
        {error && <span className="csp-upload__error">{error}</span>}
      </div>
      <button
        type="button"
        className="csp-btn csp-btn--icon csp-btn--danger csp-list__remove"
        title="Remove image"
        aria-label="Remove image"
        onClick={props.onRemove}
      >
        ×
      </button>
      {picker.input}
    </div>
  );
}

/**
 * A list of image URLs. With an uploader: drag-and-drop thumbnails plus an "add image" dropzone that
 * appends. With no uploader: degrades to manual URL entry (`StringListField`).
 */
export function ImageListField(props: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  const uploader = useUploader();
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const { busy, upload } = useUpload(uploader ?? (async () => ''), (url) =>
    props.onChange([...props.values, url]),
  );
  const adder = useFilePicker(upload);

  if (!uploader) return <StringListField {...props} />; // manual URL entry only

  const reorderTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= props.values.length) return;
    props.onChange(move(props.values, from, to));
  };
  const dropAt = (i: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragging(null);
    setOverIndex(null);
    if (from != null) reorderTo(from, i);
  };
  const setAt = (i: number, url: string) =>
    props.onChange(props.values.map((v, k) => (k === i ? url : v)));
  const removeAt = (i: number) => props.onChange(props.values.filter((_, k) => k !== i));

  return (
    <Field label={props.label}>
      <div className="csp-list">
        {props.values.map((value, index) => (
          <ImageRow
            key={index}
            uploader={uploader}
            value={value}
            onChange={(url) => setAt(index, url)}
            onRemove={() => removeAt(index)}
            reorder={{
              overIndex,
              dragging,
              index,
              onDragStart: () => {
                dragIndex.current = index;
                setDragging(index);
              },
              onDragEnd: () => {
                dragIndex.current = null;
                setDragging(null);
                setOverIndex(null);
              },
              onDragOver: (e) => {
                if (dragging == null) return;
                e.preventDefault();
                if (overIndex !== index) setOverIndex(index);
              },
              onDrop: () => dropAt(index),
              onKeyDown: (e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  reorderTo(index, index - 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  reorderTo(index, index + 1);
                }
              },
            }}
          />
        ))}
        <Dropzone onFile={upload} open={adder.open} busy={busy} label={`Add ${props.addLabel}`} />
        {adder.input}
      </div>
    </Field>
  );
}
