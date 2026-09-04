export class ConfigError extends Error {
  readonly keys: string[];

  constructor(keys: string[], message: string) {
    super(message);
    this.name = 'ConfigError';
    this.keys = keys;
  }
}
