import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { StringListField, TextField } from './fields';

/**
 * Image upload for EditForms. The transport is *injected* by the admin app (presign + S3 PUT, #15) so
 * the shared editing plane stays decoupled from a specific backend — and image bytes never route
 * through Lambda (§6). With no uploader in context, the fields degrade to manual URL entry.
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

/** A button that picks an image file, runs it through the injected uploader, and yields a CDN URL. */
export function UploadButton({
  onUploaded,
  label = 'upload image',
}: {
  onUploaded: (cdnUrl: string) => void;
  label?: string;
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
        accept="image/*"
        style={{ display: 'none' }}
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

/** A single image: a URL field plus an upload button. */
export function ImageField(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="csp-image-field">
      <TextField {...props} />
      <UploadButton onUploaded={props.onChange} />
    </div>
  );
}

/** A list of image URLs: manual entry/reorder/remove (via StringListField) plus upload-to-append. */
export function ImageListField(props: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="csp-image-field">
      <StringListField {...props} />
      <UploadButton
        label={`upload ${props.addLabel}`}
        onUploaded={(url) => props.onChange([...props.values, url])}
      />
    </div>
  );
}
