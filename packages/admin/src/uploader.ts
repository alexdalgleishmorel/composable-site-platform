import type { Uploader } from '@csp/blocks';

/**
 * The real image uploader (§6, #15): POST `/uploads/presign` to get a one-time S3 URL, PUT the bytes
 * STRAIGHT to S3 (never through Lambda), and return the CDN URL stored in the block data.
 */
export function createPresignUploader(baseUrl: string, getToken: () => string | null): Uploader {
  return async (file) => {
    const token = getToken();
    const presign = await fetch(`${baseUrl}/uploads/presign`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ contentType: file.type }),
    });
    if (!presign.ok) throw new Error(`presign failed: ${presign.status}`);
    const { uploadUrl, cdnUrl } = (await presign.json()) as { uploadUrl: string; cdnUrl: string };

    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type },
      body: file,
    });
    if (!put.ok) throw new Error(`upload failed: ${put.status}`);
    return cdnUrl;
  };
}

/** Local-dev uploader: returns an object URL so previews render without a backend. */
export const mockUploader: Uploader = async (file) => URL.createObjectURL(file);
