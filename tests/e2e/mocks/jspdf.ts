// Mock implementation of jspdf and html2canvas PDF exporters

export const mockHtml2Canvas = jest.fn().mockImplementation(async (element: HTMLElement, options?: any) => {
  return {
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 800,
    height: 600
  };
});

export class MockJsPDF {
  static instances: MockJsPDF[] = [];
  calls: string[] = [];
  savedFilename: string | null = null;

  constructor(options?: any) {
    MockJsPDF.instances.push(this);
  }

  text(text: string, x: number, y: number) {
    this.calls.push(`text:${text} at ${x},${y}`);
    return this;
  }

  setFontSize(size: number) {
    this.calls.push(`setFontSize:${size}`);
    return this;
  }

  setTextColor(r: any, g?: any, b?: any) {
    this.calls.push(`setTextColor:${r},${g},${b}`);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, style?: string) {
    this.calls.push(`rect:${x},${y},${w},${h}`);
    return this;
  }

  addImage(img: any, format: string, x: number, y: number, w: number, h: number) {
    this.calls.push(`addImage:${format} at ${x},${y}`);
    return this;
  }

  addPage() {
    this.calls.push('addPage');
    return this;
  }

  save(filename: string) {
    this.savedFilename = filename;
    this.calls.push(`save:${filename}`);
    return Promise.resolve();
  }

  output(type?: string) {
    this.calls.push(`output:${type}`);
    if (type === 'arraybuffer') {
      return new ArrayBuffer(100);
    }
    if (type === 'blob') {
      return new Blob([new ArrayBuffer(100)], { type: 'application/pdf' });
    }
    return 'mock-pdf-binary-string';
  }
}

export const jsPDF = MockJsPDF;
export const html2canvas = mockHtml2Canvas;
