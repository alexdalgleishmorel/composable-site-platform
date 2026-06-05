import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignResult {
  uploadUrl: string;
  cdnUrl: string;
  key: string;
}

export interface Presigner {
  presignUpload(tenantId: string, contentType: string): Promise<PresignResult>;
}

/**
 * Presigned S3 PUT: the browser uploads bytes DIRECTLY to S3 with the returned `uploadUrl`; image
 * bytes never route through Lambda (§6). The object key is namespaced by tenant.
 */
export function createS3Presigner(opts: {
  bucket: string;
  cdnBase: string;
  client?: S3Client;
  keygen?: () => string;
}): Presigner {
  const client = opts.client ?? new S3Client({});
  const keygen = opts.keygen ?? (() => globalThis.crypto.randomUUID());
  return {
    async presignUpload(tenantId, contentType) {
      const ext = contentType.split('/')[1] ?? 'bin';
      const key = `${tenantId}/${keygen()}.${ext}`;
      const uploadUrl = await getSignedUrl(
        client,
        new PutObjectCommand({ Bucket: opts.bucket, Key: key, ContentType: contentType }),
        { expiresIn: 300 },
      );
      return { uploadUrl, cdnUrl: `${opts.cdnBase}/${key}`, key };
    },
  };
}
