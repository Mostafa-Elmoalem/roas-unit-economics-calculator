// PDF_THEME matrix row: the PDF canvas background follows the active theme
// (dark `#09090b`, light `#f8fafc`) — never the formerly hardcoded dark.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  html2canvas: vi.fn(),
  addImage: vi.fn(),
  save: vi.fn(),
}));

vi.mock('html2canvas', () => ({ default: mocks.html2canvas }));
vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addImage: mocks.addImage,
      save: mocks.save,
    };
  }),
}));

import { exportElementToPDF } from './pdfExport';

const fakeElement = { scrollWidth: 800, scrollHeight: 600 };
(globalThis as Record<string, unknown>).document = {
  getElementById: () => fakeElement,
};
// The catch-path fallback calls window.print(); stub it so real failures
// surface as assertion errors instead of a ReferenceError.
(globalThis as Record<string, unknown>).window = { print: () => {} };

beforeEach(() => {
  mocks.html2canvas.mockReset();
  mocks.html2canvas.mockResolvedValue({
    width: 800,
    height: 600,
    toDataURL: () => 'data:image/png;base64,AAAA',
  });
});

describe('PDF export background follows the active theme (PDF_THEME)', () => {
  it('renders the canvas against #f8fafc when the light theme is active', async () => {
    await exportElementToPDF('report', 'Report', 'light');

    expect(mocks.html2canvas).toHaveBeenCalledWith(
      fakeElement,
      expect.objectContaining({ backgroundColor: '#f8fafc' })
    );
  });

  it('renders the canvas against #09090b when the dark theme is active', async () => {
    await exportElementToPDF('report', 'Report', 'dark');

    expect(mocks.html2canvas).toHaveBeenCalledWith(
      fakeElement,
      expect.objectContaining({ backgroundColor: '#09090b' })
    );
  });

  it('never falls back to the hardcoded dark background in light theme', async () => {
    await exportElementToPDF('report', 'Report', 'light');

    const options = mocks.html2canvas.mock.calls[0]?.[1] as { backgroundColor?: string };
    expect(options?.backgroundColor).toBe('#f8fafc');
    expect(options?.backgroundColor).not.toBe('#09090b');
  });
});
