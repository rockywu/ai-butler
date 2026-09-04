export class AppError extends Error {
  readonly code: number;
  readonly details: undefined | unknown;
  readonly statusCode: number;

  constructor(options: {
    cause?: unknown;
    code: number;
    details?: unknown;
    message: string;
    statusCode: number;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.statusCode = options.statusCode;
  }
}
