import {
  createContext,
  useContext,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  ASPECT_PRESETS,
  aspectCss,
  imageUrl,
  isAspectRatio,
  objectPositionCss,
  readImage,
  type ImageValue,
  type NormalizedImage,
} from '../image';
import { Field, move, SelectField, StringListField, TextField } from './fields';

/**
 * Image / asset upload for EditForms. The transport is *injected* by the admin app (presign + S3 PUT,
 * #15) so the shared editing plane stays decoupled from a specific backend — and image bytes never
 * route through Lambda (§6). With no uploader in context, the fields degrade to manual URL entry.
 *
 * Visually (Knit redesign) an image is a **drag-and-drop dropzone** that's also click-to-browse; once
 * set it becomes a **framed preview** carrying an editable aspect ratio (default 4:5) and a drag-to-
 * reposition focal point, plus Replace / Remove. The stored value is a {@link ImageValue}: a bare URL
 * string (legacy / freshly uploaded) that the frame controls upgrade to the framed object form. The
 * `UploadButton` (URL field + button) is kept for non-image assets like Lottie JSON (`AnimationField`).
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

/** Merge a freshly uploaded URL into an existing value, preserving frame settings on Replace. A
 *  fresh upload (or replacing a bare-string value) stays a bare string until the frame is edited. */
function withUrl(prev: ImageValue | undefined, url: string): ImageValue {
  return prev && typeof prev === 'object' ? { ...prev, url } : url;
}

/** Upgrade a value to the framed object form with a patched aspect ratio / focal point. */
function withFrame(
  prev: ImageValue,
  patch: Partial<{ aspectRatio: string; focalX: number; focalY: number }>,
): ImageValue {
  const n = readImage(prev);
  return { url: n.url, aspectRatio: n.aspectRatio, focalX: n.focalX, focalY: n.focalY, ...patch };
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

const CUSTOM = '__custom__';

/** The aspect-ratio control: a preset dropdown (4:5, 1:1, …, Original) plus a "Custom…" option that
 *  reveals a free-form `W:H` input. Emits only valid ratios (`isAspectRatio`). */
function AspectField({ value, onChange }: { value: string; onChange: (ratio: string) => void }) {
  const isPreset = ASPECT_PRESETS.some((p) => p.value === value);
  const [customMode, setCustomMode] = useState(!isPreset);
  const [customText, setCustomText] = useState(isPreset ? '' : value);

  return (
    <div className="csp-aspect">
      <SelectField
        label="Aspect ratio"
        value={customMode ? CUSTOM : value}
        options={[...ASPECT_PRESETS, { value: CUSTOM, label: 'Custom…' }]}
        onChange={(v) => {
          if (v === CUSTOM) {
            setCustomMode(true);
            if (isAspectRatio(customText)) onChange(customText);
          } else {
            setCustomMode(false);
            onChange(v);
          }
        }}
      />
      {customMode && (
        <TextField
          label="Custom ratio (W:H)"
          value={customText}
          placeholder="e.g. 5:7"
          mono
          onChange={(t) => {
            setCustomText(t);
            if (isAspectRatio(t)) onChange(t);
          }}
        />
      )}
    </div>
  );
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/**
 * A live crop preview at the chosen aspect ratio: the image is `object-fit: cover`-ed into the frame
 * and the user **drags it to reposition** (pan), which sets the CSS `object-position` focal point so a
 * fixed crop no longer cuts off the important part. Keyboard-operable (arrow keys pan). When the ratio
 * is "original" there is no crop, so repositioning is disabled.
 */
function FocalPointPicker({
  image,
  onFocal,
}: {
  image: NormalizedImage;
  onFocal: (focalX: number, focalY: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; fx: number; fy: number } | null>(null);
  const isOriginal = image.aspectRatio === 'original';

  const onPointerDown = (e: ReactPointerEvent) => {
    if (isOriginal || !boxRef.current) return;
    boxRef.current.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, fx: image.focalX, fy: image.focalY };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    // Pan: dragging the image right (dx > 0) reveals its left edge → object-position X decreases.
    onFocal(
      clampPct(d.fx - ((e.clientX - d.px) / rect.width) * 100),
      clampPct(d.fy - ((e.clientY - d.py) / rect.height) * 100),
    );
  };
  const endDrag = (e: ReactPointerEvent) => {
    if (boxRef.current?.hasPointerCapture(e.pointerId))
      boxRef.current.releasePointerCapture(e.pointerId);
    drag.current = null;
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (isOriginal) return;
    const step = 4;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowRight') dx = -step;
    else if (e.key === 'ArrowLeft') dx = step;
    else if (e.key === 'ArrowDown') dy = -step;
    else if (e.key === 'ArrowUp') dy = step;
    else return;
    e.preventDefault();
    onFocal(clampPct(image.focalX + dx), clampPct(image.focalY + dy));
  };

  return (
    <div
      ref={boxRef}
      className={'csp-focal' + (isOriginal ? ' csp-focal--original' : '')}
      style={{ aspectRatio: aspectCss(image.aspectRatio) }}
      role="group"
      aria-label="Reposition image within frame"
      tabIndex={isOriginal ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <img
        className="csp-focal__img"
        src={image.url}
        alt=""
        draggable={false}
        style={
          isOriginal ? undefined : { objectPosition: objectPositionCss(image.focalX, image.focalY) }
        }
      />
    </div>
  );
}

/** The filled state: a framed, repositionable preview + aspect-ratio picker + Replace / Center / Remove. */
function FramedImage({
  value,
  onChange,
  onReplace,
  onRemove,
}: {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const image = readImage(value);
  const framed = image.aspectRatio !== 'original';
  return (
    <div className="csp-imgframe">
      <FocalPointPicker
        image={image}
        onFocal={(focalX, focalY) => onChange(withFrame(value, { focalX, focalY }))}
      />
      <div className="csp-imgframe__side">
        <AspectField
          value={image.aspectRatio}
          onChange={(aspectRatio) => onChange(withFrame(value, { aspectRatio }))}
        />
        {framed && (
          <p className="csp-field__hint csp-imgframe__hint">
            Drag the image to reposition it within the frame.
          </p>
        )}
        <div className="csp-imgfield__actions">
          <button type="button" className="csp-linkbtn" onClick={onReplace}>
            Replace
          </button>
          {framed && (
            <button
              type="button"
              className="csp-linkbtn"
              onClick={() => onChange(withFrame(value, { focalX: 50, focalY: 50 }))}
            >
              Center
            </button>
          )}
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

/**
 * A button that picks a file, runs it through the injected uploader, and yields a CDN URL. `accept`
 * defaults to images but is overridable (e.g. Lottie JSON for animation uploads) — the transport is
 * content-type agnostic (the presign endpoint signs a PUT for any type), so only the picker filter
 * changes. With no uploader in context it renders nothing (manual URL entry only).
 */
export function UploadButton({
  onUploaded,
  label = 'upload image',
  accept = 'image/*',
}: {
  onUploaded: (cdnUrl: string) => void;
  label?: string;
  accept?: string;
}) {
  const uploader = useUploader();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!uploader) return null; // manual URL entry only

  return (
    <span className="csp-upload">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="csp-upload__input"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            onUploaded(await uploader(file));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'upload failed');
          } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
          }
        }}
      />
      <button
        type="button"
        className="csp-btn csp-btn--add"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'uploading…' : label}
      </button>
      {error && <span className="csp-upload__error">{error}</span>}
    </span>
  );
}

/** A single image: dropzone → upload → framed, repositionable preview. Falls back to a URL field with
 *  no uploader (dev/test; the frame controls need the upload plane). */
export function ImageField(props: {
  label: string;
  value: ImageValue | undefined;
  onChange: (value: ImageValue) => void;
  placeholder?: string;
}) {
  const uploader = useUploader();
  const { busy, error, upload } = useUpload(uploader ?? (async () => ''), (url) =>
    props.onChange(withUrl(props.value, url)),
  );
  const picker = useFilePicker(upload);

  if (!uploader) {
    return (
      <TextField
        label={props.label}
        value={props.value ? imageUrl(props.value) : ''}
        placeholder={props.placeholder}
        onChange={props.onChange}
      />
    );
  }

  return (
    <Field label={props.label}>
      {props.value && imageUrl(props.value) ? (
        <FramedImage
          value={props.value}
          onChange={props.onChange}
          onReplace={picker.open}
          onRemove={() => props.onChange('')}
        />
      ) : (
        <Dropzone onFile={upload} open={picker.open} busy={busy} />
      )}
      {error && <span className="csp-upload__error">{error}</span>}
      {picker.input}
    </Field>
  );
}

/**
 * A single animation asset: a URL field plus an upload button that accepts Lottie JSON. Reuses the
 * same injected uploader as images — animation bytes go straight to S3/CDN, never through Lambda.
 * `accept` is overridable if a client wants to allow more formats (e.g. `image/svg+xml`).
 */
export function AnimationField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  accept?: string;
}) {
  return (
    <div className="csp-image-field">
      <TextField
        label={props.label}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder ?? 'https://… .json'}
      />
      <UploadButton
        label="upload animation"
        accept={props.accept ?? '.json,.lottie,application/json'}
        onUploaded={props.onChange}
      />
    </div>
  );
}

/** One row of an image list when an uploader is present: framed preview/dropzone + drag grip + remove. */
function ImageRow(props: {
  uploader: Uploader;
  value: ImageValue;
  onChange: (value: ImageValue) => void;
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
  const { busy, error, upload } = useUpload(props.uploader, (url) =>
    props.onChange(withUrl(props.value, url)),
  );
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
        {imageUrl(props.value) ? (
          <FramedImage
            value={props.value}
            onChange={props.onChange}
            onReplace={picker.open}
            onRemove={props.onRemove}
          />
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
 * A list of images. With an uploader: framed, repositionable thumbnails plus an "add image" dropzone
 * that appends. With no uploader: degrades to manual URL entry (`StringListField`).
 */
export function ImageListField(props: {
  label: string;
  values: ImageValue[];
  onChange: (next: ImageValue[]) => void;
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

  if (!uploader) {
    return (
      <StringListField
        label={props.label}
        values={props.values.map(imageUrl)}
        onChange={props.onChange}
        addLabel={props.addLabel}
        placeholder={props.placeholder}
      />
    ); // manual URL entry only
  }

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
  const setAt = (i: number, value: ImageValue) =>
    props.onChange(props.values.map((v, k) => (k === i ? value : v)));
  const removeAt = (i: number) => props.onChange(props.values.filter((_, k) => k !== i));

  return (
    <Field label={props.label}>
      <div className="csp-list">
        {props.values.map((value, index) => (
          <ImageRow
            key={index}
            uploader={uploader}
            value={value}
            onChange={(v) => setAt(index, v)}
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
