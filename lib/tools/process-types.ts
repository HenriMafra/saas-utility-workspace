/** Shared contract for client-side tool processing. */

export interface OutputFile {
  name: string;
  blob: Blob;
}

export interface ProcessResult {
  files: OutputFile[];
  /** Short human summary shown in the ResultPanel, e.g. "Reduzido 64% (8MB → 2,9MB)". */
  summary: string;
  /** Optional extracted text (OCR / assistant). */
  text?: string;
}

/** Thrown by adapters with a known error code from lib/errors/codes. */
export class ToolError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message || code);
    this.name = "ToolError";
  }
}
