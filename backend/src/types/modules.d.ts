declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function pdf(buffer: Buffer, options?: any): Promise<PDFData>;
  export = pdf;
}

declare module 'mammoth' {
  interface ConvertOptions {
    convertImage?: any;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
  }

  interface Result {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<Result>;
  export function convertToHtml(options: { buffer: Buffer } & ConvertOptions): Promise<Result>;
}
