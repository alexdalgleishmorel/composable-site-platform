import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ImageValue } from '../image';
import { AnimationField, ImageField, ImageListField, UploaderProvider } from './upload';

const pngFile = (name = 'a.png') => new File(['x'], name, { type: 'image/png' });
const fileInput = (root: HTMLElement) =>
  root.querySelector('input[type="file"]') as HTMLInputElement;

describe('image upload fields', () => {
  it('uploads a file through the injected uploader and sets a bare URL', async () => {
    const uploader = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    function Harness() {
      const [value, setValue] = useState<ImageValue | undefined>(undefined);
      return (
        <UploaderProvider uploader={uploader}>
          <ImageField label="Image" value={value} onChange={setValue} />
          <output data-testid="v">{JSON.stringify(value)}</output>
        </UploaderProvider>
      );
    }
    const { container } = render(<Harness />);
    fireEvent.change(fileInput(container), { target: { files: [pngFile()] } });

    // A fresh upload stays a bare URL string (the frame stays default until edited).
    await waitFor(() =>
      expect(screen.getByTestId('v').textContent).toBe('"https://cdn.example/a.png"'),
    );
    expect(uploader).toHaveBeenCalledOnce();
  });

  it('falls back to a URL text field when no uploader is in context', () => {
    render(
      <UploaderProvider uploader={null}>
        <ImageField label="Image" value={undefined} onChange={() => {}} />
      </UploaderProvider>,
    );
    expect(screen.queryByText('upload image')).toBeNull();
    expect(screen.getByLabelText('Image')).toBeTruthy(); // manual URL entry
  });

  it('appends the uploaded URL to an image list', async () => {
    const uploader = vi.fn().mockResolvedValue('https://cdn.example/b.png');
    function Harness() {
      const [values, setValues] = useState<ImageValue[]>(['https://cdn.example/a.png']);
      return (
        <UploaderProvider uploader={uploader}>
          <ImageListField label="Images" values={values} onChange={setValues} addLabel="image" />
          <output data-testid="n">{values.length}</output>
        </UploaderProvider>
      );
    }
    const { container } = render(<Harness />);
    // The "add image" dropzone owns the last file input; selecting a file there appends.
    const inputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(inputs[inputs.length - 1]!, { target: { files: [pngFile('b.png')] } });

    await waitFor(() => expect(screen.getByTestId('n').textContent).toBe('2'));
  });

  it('uploads a Lottie file via AnimationField (json picker) and sets the URL', async () => {
    const uploader = vi.fn().mockResolvedValue('https://cdn.example/anim.json');
    function Harness() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <UploaderProvider uploader={uploader}>
          <AnimationField label="Animation" value={value} onChange={setValue} />
          <output data-testid="v">{value}</output>
        </UploaderProvider>
      );
    }
    const { container } = render(<Harness />);
    const input = fileInput(container);
    expect(input.getAttribute('accept')).toContain('json');
    fireEvent.change(input, {
      target: { files: [new File(['{}'], 'anim.json', { type: 'application/json' })] },
    });

    await waitFor(() =>
      expect(screen.getByTestId('v').textContent).toBe('https://cdn.example/anim.json'),
    );
    expect(uploader).toHaveBeenCalledOnce();
  });
});

describe('image frame (aspect ratio + focal point)', () => {
  const uploader = vi.fn().mockResolvedValue('https://cdn.example/x.png');

  function FrameHarness({ initial }: { initial: ImageValue }) {
    const [value, setValue] = useState<ImageValue>(initial);
    return (
      <UploaderProvider uploader={uploader}>
        <ImageField label="Image" value={value} onChange={setValue} />
        <output data-testid="v">{JSON.stringify(value)}</output>
      </UploaderProvider>
    );
  }

  it('renders a legacy bare-URL string in the default 4:5 frame', () => {
    const { container } = render(<FrameHarness initial="https://cdn.example/legacy.png" />);
    expect((screen.getByLabelText('Aspect ratio') as HTMLSelectElement).value).toBe('4:5');
    expect(container.querySelector('.csp-focal__img')?.getAttribute('src')).toBe(
      'https://cdn.example/legacy.png',
    );
  });

  it('upgrades a bare-URL value to the object form when the aspect ratio changes', () => {
    render(<FrameHarness initial="https://cdn.example/legacy.png" />);
    fireEvent.change(screen.getByLabelText('Aspect ratio'), { target: { value: '1:1' } });
    expect(JSON.parse(screen.getByTestId('v').textContent!)).toEqual({
      url: 'https://cdn.example/legacy.png',
      aspectRatio: '1:1',
      focalX: 50,
      focalY: 50,
    });
  });

  it('repositions the focal point via the keyboard (upgrading to the object form)', () => {
    render(<FrameHarness initial="https://cdn.example/legacy.png" />);
    fireEvent.keyDown(screen.getByRole('group', { name: /reposition image within frame/i }), {
      key: 'ArrowRight',
    });
    // ArrowRight pans the image right → object-position X decreases from the 50% centre.
    expect(JSON.parse(screen.getByTestId('v').textContent!)).toEqual({
      url: 'https://cdn.example/legacy.png',
      aspectRatio: '4:5',
      focalX: 46,
      focalY: 50,
    });
  });
});
