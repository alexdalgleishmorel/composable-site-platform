import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnimationField, ImageField, ImageListField, UploaderProvider } from './upload';

const pngFile = (name = 'a.png') => new File(['x'], name, { type: 'image/png' });
const fileInput = (root: HTMLElement) =>
  root.querySelector('input[type="file"]') as HTMLInputElement;

describe('image upload fields', () => {
  it('uploads a file through the injected uploader and sets the URL', async () => {
    const uploader = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    function Harness() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <UploaderProvider uploader={uploader}>
          <ImageField label="Image" value={value} onChange={setValue} />
          <output data-testid="v">{value}</output>
        </UploaderProvider>
      );
    }
    const { container } = render(<Harness />);
    fireEvent.change(fileInput(container), { target: { files: [pngFile()] } });

    await waitFor(() =>
      expect(screen.getByTestId('v').textContent).toBe('https://cdn.example/a.png'),
    );
    expect(uploader).toHaveBeenCalledOnce();
  });

  it('hides the upload button when no uploader is in context (manual URL entry only)', () => {
    render(
      <UploaderProvider uploader={null}>
        <ImageField label="Image" value={undefined} onChange={() => {}} />
      </UploaderProvider>,
    );
    expect(screen.queryByText('upload image')).toBeNull();
  });

  it('appends the uploaded URL to an image list', async () => {
    const uploader = vi.fn().mockResolvedValue('https://cdn.example/b.png');
    function Harness() {
      const [values, setValues] = useState<string[]>(['https://cdn.example/a.png']);
      return (
        <UploaderProvider uploader={uploader}>
          <ImageListField label="Images" values={values} onChange={setValues} addLabel="image" />
          <output data-testid="n">{values.length}</output>
        </UploaderProvider>
      );
    }
    const { container } = render(<Harness />);
    fireEvent.change(fileInput(container), { target: { files: [pngFile('b.png')] } });

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
