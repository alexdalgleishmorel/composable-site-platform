import { PREVIEW_MESSAGE_TYPE } from '@csp/bundle-kit';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleContent } from './mockContent';
import { PreviewPane } from './PreviewPane';

afterEach(() => vi.useRealTimers());

describe('PreviewPane', () => {
  it('posts a debounced preview message into the iframe when content changes', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<PreviewPane previewUrl="about:blank" content={null} />);
    const iframe = container.querySelector('iframe')!;
    const post = vi.spyOn(iframe.contentWindow!, 'postMessage');

    rerender(<PreviewPane previewUrl="about:blank" content={sampleContent()} />);
    expect(post).not.toHaveBeenCalled(); // debounced
    vi.advanceTimersByTime(250);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: PREVIEW_MESSAGE_TYPE }), '*');
  });

  it('does not post when there is no working content yet', () => {
    vi.useFakeTimers();
    const { container } = render(<PreviewPane previewUrl="about:blank" content={null} />);
    const post = vi.spyOn(container.querySelector('iframe')!.contentWindow!, 'postMessage');
    vi.advanceTimersByTime(500);
    expect(post).not.toHaveBeenCalled();
  });
});
