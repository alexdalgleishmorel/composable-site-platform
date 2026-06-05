import { UploaderProvider, type Uploader } from '@csp/blocks';
import type { TenantContent } from '@csp/core';
import { useState } from 'react';
import type { ContentApi } from './api';
import { Editor } from './Editor';
import { PreviewPane } from './PreviewPane';

/**
 * The signed-in admin UI, identical for every auth backend: the block editor on the left, the live
 * iframe preview on the right, with the injected content API and image uploader.
 */
export function AdminWorkspace({
  api,
  uploader,
  previewUrl,
}: {
  api: ContentApi;
  uploader: Uploader | null;
  previewUrl: string;
}) {
  const [working, setWorking] = useState<TenantContent | null>(null);
  return (
    <UploaderProvider uploader={uploader}>
      <div className="admin-split">
        <div className="admin-split__edit">
          <Editor api={api} onContentChange={setWorking} />
        </div>
        <div className="admin-split__preview">
          <PreviewPane previewUrl={previewUrl} content={working} />
        </div>
      </div>
    </UploaderProvider>
  );
}
